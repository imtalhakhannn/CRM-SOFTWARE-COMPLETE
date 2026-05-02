"""Seed realistic demo data. Run: python seed.py [--fresh|--if-empty]

  --fresh     wipes ALL rows before seeding (default if you want to reset).
  --if-empty  only seeds when the users table is empty — safe to run on every
              boot so deployments on ephemeral filesystems (Hugging Face
              Spaces, etc.) always come up with demo data.

With no flag the script behaves like the original: it bails if an admin user
already exists.
"""
import random
import secrets
import sys
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import text

from app.core.security import hash_password
from app.db.base_class import Base
from app.db.bootstrap import ensure_database
from app.db.session import SessionLocal, engine
import app.models  # noqa
from app.models.application import Application, ApplicationStatus, Workflow, WorkflowStage
from app.models.campaign import Campaign, CampaignStatus
from app.models.checkin import CheckIn
from app.models.classroom import CourseMaterial
from app.models.contact import Contact, ContactType, ProspectRating
from app.models.conversation import Conversation, Message
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus, Payment
from app.models.quotation import Quotation, QuotationItem
from app.models.service import Partner, Product, Service
from app.models.task import Appointment, Task, TaskStatus
from app.models.user import Branch, Team, User, UserRole


def _wipe(db):
    # order matters: children first. Wrap each DELETE so a missing table
    # (e.g. fresh SQLite where alembic skipped a CREATE) doesn't abort the
    # whole wipe.
    for tbl in [
        "payments", "invoice_items", "invoices",
        "quotation_items", "quotations",
        "messages", "conversations",
        "appointments", "tasks", "documents",
        "applications", "workflow_stages", "workflows",
        "products", "partners", "services",
        "campaigns", "course_materials", "checkins",
        "contacts",
        "teams", "users", "branches",
    ]:
        try:
            db.execute(text(f"DELETE FROM {tbl}"))
        except Exception as e:
            db.rollback()
            print(f"[seed] _wipe: skipped {tbl} ({e.__class__.__name__})")
    db.commit()


def run(fresh: bool = False, if_empty: bool = False):
    ensure_database()
    # Belt-and-braces: alembic migrations create most tables, but if any are
    # missing (broken migration on SQLite, fresh ephemeral disk) this fills
    # the gaps so seeding never crashes on "no such table".
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if if_empty:
            existing = db.query(User).count()
            if existing > 0:
                print(f"[seed] DB has {existing} users — skipping (--if-empty).")
                return
            print("[seed] DB is empty — proceeding with seed.")
        elif fresh:
            _wipe(db)
        elif db.query(User).filter(User.email == "admin@crm.io").first():
            print("Admin already exists — pass --fresh to reseed.")
            return

        # --- Branches & Teams ---
        branches = [
            Branch(name="Head Office", address="123 Main St, Sydney", phone="+61 2 9999 0000", email="hq@crm.io"),
            Branch(name="Melbourne Branch", address="45 Collins St, Melbourne", phone="+61 3 8888 0000", email="mel@crm.io"),
            Branch(name="Karachi Branch", address="Clifton, Karachi", phone="+92 21 3333 0000", email="khi@crm.io"),
        ]
        db.add_all(branches); db.flush()

        teams = [
            Team(name="Sales", description="Inbound & outbound sales", branch_id=branches[0].id),
            Team(name="Admissions", description="Education counselling", branch_id=branches[0].id),
            Team(name="Visa", description="Visa application handling", branch_id=branches[1].id),
        ]
        db.add_all(teams); db.flush()

        # --- Users ---
        admin = User(email="admin@crm.io", full_name="Admin User", role=UserRole.SUPER_ADMIN,
                     hashed_password=hash_password("admin123"), branch_id=branches[0].id, team_id=teams[0].id,
                     phone="+61 400 000 000")
        abrar = User(email="abrar@gmail.com", full_name="Abrar", role=UserRole.SUPER_ADMIN,
                     hashed_password=hash_password("abrar123"), branch_id=branches[0].id, team_id=teams[0].id,
                     phone="+92 300 000 0000")
        manager = User(email="manager@crm.io", full_name="Sarah Mitchell", role=UserRole.MANAGER,
                       hashed_password=hash_password("manager123"), branch_id=branches[0].id, team_id=teams[0].id,
                       phone="+61 400 111 222")
        consultant = User(email="consultant@crm.io", full_name="Sajjad Ali Syed", role=UserRole.CONSULTANT,
                          hashed_password=hash_password("consultant123"), branch_id=branches[0].id, team_id=teams[1].id,
                          phone="+61 400 333 444")
        consultant2 = User(email="priya@crm.io", full_name="Priya Sharma", role=UserRole.CONSULTANT,
                           hashed_password=hash_password("demo123"), branch_id=branches[1].id, team_id=teams[1].id,
                           phone="+61 400 555 666")
        agent1 = User(email="james@crm.io", full_name="James Park", role=UserRole.AGENT,
                      hashed_password=hash_password("demo123"), branch_id=branches[0].id,
                      phone="+61 400 777 888")
        agent2 = User(email="fatima@crm.io", full_name="Fatima Khan", role=UserRole.AGENT,
                      hashed_password=hash_password("demo123"), branch_id=branches[2].id,
                      phone="+92 300 123 4567")
        agent3 = User(email="liam@crm.io", full_name="Liam O'Brien", role=UserRole.AGENT,
                      hashed_password=hash_password("demo123"), branch_id=branches[1].id,
                      phone="+61 400 999 000")
        users = [admin, abrar, manager, consultant, consultant2, agent1, agent2, agent3]
        db.add_all(users); db.flush()

        # --- Workflows ---
        workflow_defs = [
            ("Australian Education", "#6366f1", ["Enquiry", "Application", "Offer", "COE", "Visa", "Completed"]),
            ("VISA Service",         "#f59e0b", ["Documents", "Lodged", "Decision", "Completed"]),
            ("Insurance Service",    "#8b5cf6", ["Quote", "Paid", "Active"]),
            ("US Education F1",      "#eab308", ["Enquiry", "Offer", "I-20", "Visa", "Completed"]),
            ("UK Student Visa",      "#06b6d4", ["Prep", "CAS", "Submitted", "Granted"]),
        ]
        workflows = []
        for name, color, stages in workflow_defs:
            wf = Workflow(name=name, color=color)
            for i, s in enumerate(stages):
                wf.stages.append(WorkflowStage(name=s, order=i, is_final=(i == len(stages) - 1)))
            db.add(wf); workflows.append(wf)
        db.flush()

        # --- Services / Partners / Products ---
        services = [
            Service(name="Education Counselling", code="EDU-01", base_price=500, currency="AUD"),
            Service(name="Visa Application",      code="VISA-01", base_price=800, currency="AUD"),
            Service(name="OSHC Insurance",        code="INS-01", base_price=600, currency="AUD"),
            Service(name="Accommodation Booking", code="ACC-01", base_price=200, currency="AUD"),
        ]
        db.add_all(services); db.flush()

        partners = [
            Partner(name="Monash University", type="University", country="Australia", commission_rate=12.5, email="agents@monash.edu", website="https://monash.edu"),
            Partner(name="University of Sydney", type="University", country="Australia", commission_rate=10, email="agents@sydney.edu.au"),
            Partner(name="University of Melbourne", type="University", country="Australia", commission_rate=11, email="agents@unimelb.edu.au"),
            Partner(name="RMIT University", type="University", country="Australia", commission_rate=13, email="agents@rmit.edu.au"),
            Partner(name="Bupa Australia", type="Insurance", country="Australia", commission_rate=8, email="partners@bupa.com.au"),
            Partner(name="MIT (USA)", type="University", country="USA", commission_rate=9, email="intl@mit.edu"),
            Partner(name="Imperial College London", type="University", country="UK", commission_rate=10, email="intl@imperial.ac.uk"),
        ]
        db.add_all(partners); db.flush()

        products = [
            Product(name="Master of IT", code="MONASH-MIT", level="Masters", intake="Feb/Jul", price=45000, currency="AUD", duration_months=24, service_id=services[0].id, partner_id=partners[0].id),
            Product(name="Bachelor of Commerce", code="USYD-BCOM", level="Bachelors", intake="Mar/Aug", price=52000, currency="AUD", duration_months=36, service_id=services[0].id, partner_id=partners[1].id),
            Product(name="Master of Data Science", code="UOM-MDS", level="Masters", intake="Feb", price=48000, currency="AUD", duration_months=24, service_id=services[0].id, partner_id=partners[2].id),
            Product(name="MBA", code="RMIT-MBA", level="Masters", intake="Feb/Jul", price=55000, currency="AUD", duration_months=18, service_id=services[0].id, partner_id=partners[3].id),
            Product(name="OSHC Single Cover", code="BUPA-SINGLE", level="Insurance", intake="Anytime", price=650, currency="AUD", duration_months=12, service_id=services[2].id, partner_id=partners[4].id),
            Product(name="MSc Computer Science", code="MIT-MSCS", level="Masters", intake="Fall", price=58000, currency="USD", duration_months=24, service_id=services[0].id, partner_id=partners[5].id),
            Product(name="MSc Finance", code="IMP-MFIN", level="Masters", intake="Sep", price=42000, currency="GBP", duration_months=12, service_id=services[0].id, partner_id=partners[6].id),
        ]
        db.add_all(products); db.flush()

        # --- Contacts ---
        first_names = ["Ahmed", "Noor", "Hassan", "Maria", "Liam", "Emma", "Raj", "Aisha", "Chen", "Sofia", "Luca", "Anya", "Marcus", "Yuki", "Priya", "David", "Fatima", "Omar"]
        last_names  = ["Khan", "Silva", "Nguyen", "Johnson", "Ali", "Garcia", "Patel", "Kim", "Martin", "Wilson", "Tanaka", "Singh", "Rahman", "Brown", "Lee", "Rossi"]
        countries   = ["India", "Pakistan", "China", "Vietnam", "Brazil", "Nigeria", "Bangladesh", "UAE", "Indonesia", "Colombia"]
        cities      = {"India": ["Mumbai", "Delhi", "Bangalore"], "Pakistan": ["Karachi", "Lahore", "Islamabad"],
                       "China": ["Beijing", "Shanghai"], "Vietnam": ["Hanoi", "Ho Chi Minh"], "Brazil": ["São Paulo"],
                       "Nigeria": ["Lagos"], "Bangladesh": ["Dhaka"], "UAE": ["Dubai"], "Indonesia": ["Jakarta"], "Colombia": ["Bogotá"]}
        sources     = ["Website", "Facebook", "Instagram", "Referral", "Google Ads", "Walk-in", "Partner"]
        ratings     = [ProspectRating.HOT, ProspectRating.WARM, ProspectRating.COLD, ProspectRating.FLAGGED, ProspectRating.DEAD]

        random.seed(42)
        contacts = []
        # 8 leads
        for i in range(8):
            c = Contact(
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                email=f"lead{i+1}@example.com",
                phone=f"+6140{random.randint(1000000, 9999999)}",
                type=ContactType.LEAD,
                source=random.choice(sources),
                country=random.choice(countries),
                nationality=random.choice(countries),
                assigned_to_id=random.choice([consultant.id, consultant2.id, agent1.id, agent2.id]),
                branch_id=random.choice([b.id for b in branches]),
            )
            c.city = random.choice(cities[c.country])
            contacts.append(c)

        # 6 prospects with ratings
        for i in range(6):
            c = Contact(
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                email=f"prospect{i+1}@example.com",
                phone=f"+6141{random.randint(1000000, 9999999)}",
                type=ContactType.PROSPECT,
                rating=random.choice(ratings),
                source=random.choice(sources),
                country=random.choice(countries),
                nationality=random.choice(countries),
                assigned_to_id=random.choice([consultant.id, consultant2.id, agent1.id, agent3.id]),
                branch_id=random.choice([b.id for b in branches]),
            )
            c.city = random.choice(cities[c.country])
            contacts.append(c)

        # 10 clients
        for i in range(10):
            c = Contact(
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                email=f"client{i+1}@example.com",
                phone=f"+6142{random.randint(1000000, 9999999)}",
                type=ContactType.CLIENT,
                source=random.choice(sources),
                country=random.choice(countries),
                nationality=random.choice(countries),
                passport_number=f"P{random.randint(1000000, 9999999)}",
                assigned_to_id=random.choice([consultant.id, consultant2.id, agent1.id, agent2.id, agent3.id]),
                branch_id=random.choice([b.id for b in branches]),
            )
            c.city = random.choice(cities[c.country])
            contacts.append(c)

        db.add_all(contacts); db.flush()

        # --- Applications ---
        apps = []
        for c in contacts[14:]:  # clients
            wf = random.choice(workflows)
            stage = random.choice(wf.stages)
            product = random.choice(products)
            status = random.choice([ApplicationStatus.IN_PROGRESS, ApplicationStatus.IN_PROGRESS,
                                    ApplicationStatus.SUBMITTED, ApplicationStatus.APPROVED])
            a = Application(
                reference="APP-" + secrets.token_hex(4).upper(),
                title=f"{product.name} for {c.first_name}",
                status=status,
                expected_start=date.today() + timedelta(days=random.randint(30, 180)),
                amount=product.price,
                currency=product.currency,
                contact_id=c.id,
                product_id=product.id,
                service_id=random.choice(services).id,
                partner_id=product.partner_id,
                workflow_id=wf.id,
                current_stage_id=stage.id,
                assigned_to_id=c.assigned_to_id,
            )
            apps.append(a)
        db.add_all(apps); db.flush()

        # --- Tasks (including ones due today) ---
        now = datetime.now(timezone.utc)
        task_titles = [
            "Follow up on enquiry", "Send offer letter", "Request transcripts",
            "Schedule IELTS booking", "Verify passport", "Prepare COE",
            "Confirm accommodation", "Draft visa covering letter", "Check medical exam results",
            "Call client for update",
        ]
        tasks = []
        for i, title in enumerate(task_titles):
            t = Task(
                title=title,
                priority=random.choice(["low", "medium", "high", "medium", "high"]),
                status=TaskStatus.PENDING if i < 7 else random.choice([TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED]),
                due_date=now + timedelta(hours=random.choice([-24, 1, 3, 6, 24, 48, 72])),
                assignee_id=random.choice([admin.id, consultant.id, consultant2.id]),
                contact_id=random.choice(contacts).id,
            )
            tasks.append(t)
        db.add_all(tasks); db.flush()

        # --- Appointments (today and upcoming) ---
        today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
        appts = [
            Appointment(title="Initial consultation · Ahmed Khan", start_at=today_start + timedelta(hours=10),
                        end_at=today_start + timedelta(hours=11), location="Meeting Room 2",
                        user_id=admin.id, contact_id=contacts[0].id),
            Appointment(title="Document review · Noor Silva", start_at=today_start + timedelta(hours=14),
                        end_at=today_start + timedelta(hours=15), location="Office", user_id=admin.id,
                        contact_id=contacts[1].id),
            Appointment(title="Visa briefing · Liam Johnson", start_at=today_start + timedelta(days=1, hours=11),
                        end_at=today_start + timedelta(days=1, hours=12), location="Zoom", user_id=consultant.id,
                        contact_id=contacts[14].id),
            Appointment(title="University fair", start_at=today_start + timedelta(days=3, hours=9),
                        end_at=today_start + timedelta(days=3, hours=17), location="Expo Hall"),
        ]
        db.add_all(appts); db.flush()

        # --- Conversations ---
        convs = [
            Conversation(subject="Enquiry about Master of IT", channel="email",
                         contact_id=contacts[0].id, user_id=admin.id,
                         messages=[
                             Message(sender="contact", body="Hi, I'm interested in the Master of IT at Monash. Can you share details?"),
                             Message(sender="user", body="Absolutely! I've attached the brochure. When would you like a call?"),
                             Message(sender="contact", body="Next Tuesday works for me."),
                         ]),
            Conversation(subject="Visa documents checklist", channel="whatsapp",
                         contact_id=contacts[14].id, user_id=consultant.id,
                         messages=[
                             Message(sender="user", body="Please prepare: passport, bank statement, IELTS result, CoE."),
                             Message(sender="contact", body="Received — will send by Friday."),
                         ]),
            Conversation(subject="Follow-up · accommodation", channel="sms",
                         contact_id=contacts[15].id, user_id=consultant2.id,
                         messages=[Message(sender="user", body="Did you finalize the accommodation booking?")]),
        ]
        db.add_all(convs); db.flush()

        # --- Quotations ---
        quotes = []
        for c in contacts[8:11]:  # a couple of prospects
            product = random.choice(products)
            q = Quotation(
                reference="QT-" + secrets.token_hex(3).upper(),
                contact_id=c.id,
                issue_date=date.today() - timedelta(days=random.randint(0, 20)),
                valid_until=date.today() + timedelta(days=30),
                currency=product.currency,
                status=random.choice(["draft", "sent", "accepted"]),
                subtotal=product.price,
                tax=product.price * 0.1,
                total=product.price * 1.1,
                notes=f"Quote for {product.name}",
                items=[QuotationItem(description=product.name, quantity=1, unit_price=product.price, amount=product.price)],
            )
            quotes.append(q)
        db.add_all(quotes); db.flush()

        # --- Invoices + Payments ---
        invoices = []
        for a in apps[:6]:
            inv = Invoice(
                reference="INV-" + secrets.token_hex(3).upper(),
                contact_id=a.contact_id, application_id=a.id,
                issue_date=date.today() - timedelta(days=random.randint(5, 60)),
                due_date=date.today() + timedelta(days=random.randint(5, 30)),
                currency=a.currency,
                subtotal=a.amount,
                tax=a.amount * 0.1,
                total=a.amount * 1.1,
                status=InvoiceStatus.SENT,
                items=[InvoiceItem(description=a.title, quantity=1, unit_price=a.amount, amount=a.amount)],
            )
            invoices.append(inv)
        db.add_all(invoices); db.flush()

        # Mark some as paid/partially-paid
        invoices[0].payments.append(Payment(invoice_id=invoices[0].id, paid_on=date.today() - timedelta(days=3),
                                            amount=invoices[0].total, method="bank", reference="TXN-001"))
        invoices[0].amount_paid = invoices[0].total; invoices[0].status = InvoiceStatus.PAID
        invoices[1].payments.append(Payment(invoice_id=invoices[1].id, paid_on=date.today() - timedelta(days=10),
                                            amount=invoices[1].total / 2, method="card", reference="TXN-002"))
        invoices[1].amount_paid = invoices[1].total / 2; invoices[1].status = InvoiceStatus.PARTIALLY_PAID
        invoices[2].payments.append(Payment(invoice_id=invoices[2].id, paid_on=date.today() - timedelta(days=40),
                                            amount=invoices[2].total, method="bank", reference="TXN-003"))
        invoices[2].amount_paid = invoices[2].total; invoices[2].status = InvoiceStatus.PAID
        db.commit()

        # --- Campaigns ---
        campaigns = [
            Campaign(name="Spring Intake 2026 Promo", type="email", subject="Save 10% on application fees",
                     status=CampaignStatus.SENT, recipient_count=420, delivered_count=415, opened_count=192,
                     sent_at=datetime.now(timezone.utc) - timedelta(days=7),
                     content="Hello {name},\nApply before April 30 and save 10% on fees!\nCheers,\nThe team",
                     target_filter="type=lead", created_by_id=manager.id),
            Campaign(name="Monash Info Session", type="email", subject="Join us live on April 20",
                     status=CampaignStatus.SCHEDULED, scheduled_at=datetime.now(timezone.utc) + timedelta(days=3),
                     content="Join our live info session about Monash University programs.",
                     target_filter="type=prospect", created_by_id=admin.id),
            Campaign(name="Welcome pack SMS", type="sms", status=CampaignStatus.DRAFT,
                     content="Welcome! We'll be in touch shortly.", target_filter="type=client",
                     created_by_id=consultant.id),
        ]
        db.add_all(campaigns)

        # --- Course materials ---
        materials = [
            CourseMaterial(title="Onboarding: first 7 days", category="training",
                           description="Welcome guide for new team members",
                           content="Day 1: setup CRM access\nDay 2: shadow a consultant\n...",
                           duration_minutes=30, created_by_id=admin.id),
            CourseMaterial(title="SOP · Visa lodgement", category="sop",
                           description="Step-by-step process for lodging student visa",
                           video_url="https://youtu.be/example", duration_minutes=20, created_by_id=manager.id),
            CourseMaterial(title="Email template: offer letter", category="template",
                           description="Reusable template for offer letter follow-up",
                           content="Dear {first_name},\nCongratulations! ...", created_by_id=admin.id),
            CourseMaterial(title="Closing techniques", category="training",
                           description="How to move prospects to clients",
                           duration_minutes=45, video_url="https://youtu.be/example2", created_by_id=manager.id),
        ]
        db.add_all(materials)

        db.commit()

        print("[OK] Seed complete.")
        print("   Login: admin@crm.io / admin123")
        print("   Login: abrar@gmail.com / abrar123")
        print("   Login: manager@crm.io / manager123")
        print("   Login: consultant@crm.io / consultant123")
        print("   Login: priya|james|fatima|liam @ crm.io / demo123")
        print(f"   Seeded: {len(contacts)} contacts, {len(apps)} applications, {len(tasks)} tasks, "
              f"{len(appts)} appointments, {len(invoices)} invoices, {len(campaigns)} campaigns, "
              f"{len(materials)} course materials")
    finally:
        db.close()


if __name__ == "__main__":
    run(fresh="--fresh" in sys.argv, if_empty="--if-empty" in sys.argv)
