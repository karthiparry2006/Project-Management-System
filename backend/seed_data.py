import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from projects.models import Project
from tasks.models import Task, TaskComment
from assistant.services.vector_store import get_vector_store

def seed():
    print("=" * 60)
    print("PMS EXPANDED DATA SEED & VECTOR RE-INDEXING")
    print("=" * 60)
    
    # 1. Create / Update Users
    users_data = [
        {'username': 'admin', 'email': 'admin@pms.local', 'role': 'Admin', 'first_name': 'System', 'last_name': 'Admin'},
        {'username': 'manager', 'email': 'manager@pms.local', 'role': 'Project Manager', 'first_name': 'Sarah', 'last_name': 'Connor'},
        {'username': 'dev1', 'email': 'dev1@pms.local', 'role': 'Developer', 'first_name': 'Alex', 'last_name': 'Mercer'},
        {'username': 'dev2', 'email': 'dev2@pms.local', 'role': 'Developer', 'first_name': 'Elena', 'last_name': 'Fisher'},
    ]

    users = {}
    for u in users_data:
        user, created = User.objects.get_or_create(
            username=u['username'],
            defaults={
                'email': u['email'],
                'role': u['role'],
                'first_name': u['first_name'],
                'last_name': u['last_name'],
            }
        )
        user.set_password('password123')
        user.email = u['email']
        user.role = u['role']
        user.first_name = u['first_name']
        user.last_name = u['last_name']
        user.save()
        users[u['username']] = user
        status_txt = "Created" if created else "Updated"
        print(f"[{status_txt} User] {user.username} ({user.role}) - {user.email}")

    # 2. Create Projects
    today = date.today()
    projects_data = [
        {
            'name': 'Project Alpha',
            'description': 'Next-generation enterprise fintech banking portal with real-time financial telemetry, high-throughput transaction ledger, and OAuth2 security.',
            'status': 'Active',
            'start_date': today - timedelta(days=25),
            'target_deadline': today + timedelta(days=35),
            'owner': users['manager']
        },
        {
            'name': 'Project Beta',
            'description': 'Migrate legacy monolith services to containerized Kubernetes microservices on hybrid cloud infrastructure with zero downtime and multi-AZ failover.',
            'status': 'Active',
            'start_date': today - timedelta(days=15),
            'target_deadline': today + timedelta(days=45),
            'owner': users['manager']
        },
        {
            'name': 'Project Gamma',
            'description': 'AI analytics engine & native mobile client with predictive spend modeling, transaction categorization, and LLM-driven budget insights.',
            'status': 'Planning',
            'start_date': today - timedelta(days=3),
            'target_deadline': today + timedelta(days=75),
            'owner': users['manager']
        },
    ]

    projects = {}
    for p in projects_data:
        proj, created = Project.objects.get_or_create(
            name=p['name'],
            defaults=p
        )
        for k, v in p.items():
            setattr(proj, k, v)
        proj.save()
        projects[p['name']] = proj
        status_txt = "Created" if created else "Updated"
        print(f"[{status_txt} Project] {proj.name} ({proj.status}) - Deadline: {proj.target_deadline}")

    # 3. Create Tasks
    tasks_data = [
        # ========================================================
        # Project Alpha Tasks (Fintech Portal)
        # ========================================================
        {
            'project': projects['Project Alpha'],
            'title': 'Setup Redis Caching Layer',
            'description': 'Implement distributed Redis cache for user account summaries and high-frequency balance inquiries to relieve MySQL database load during peak market hours.',
            'priority': 'High',
            'status': 'Backlog',
            'order': 0,
            'assignee': users['dev1'],
            'due_date': today + timedelta(days=7),
            'comments': [
                (users['dev1'], 'Evaluating between Redis cluster and standalone Sentinel setup.'),
                (users['manager'], 'Sentinel is sufficient for Phase 1. Ensure TTL is configured to 300s to avoid stale account balances.'),
            ]
        },
        {
            'project': projects['Project Alpha'],
            'title': 'Implement OAuth2 / JWT Token Rotation',
            'description': 'Address token expiration edge cases and add refresh token rotation to avoid session hijacking across mobile and web clients.',
            'priority': 'Urgent',
            'status': 'In Progress',
            'order': 0,
            'assignee': users['dev2'],
            'due_date': today + timedelta(days=3),
            'comments': [
                (users['dev2'], 'Testing token blacklisting upon logout. MySQL table handles revoked tokens smoothly.'),
                (users['dev1'], 'Make sure clock skew tolerance is set to max 30 seconds.'),
            ]
        },
        {
            'project': projects['Project Alpha'],
            'title': 'Database Connection Pooling Optimization',
            'description': 'The payment gateway queries are causing connection spikes on MySQL. Configure PyMySQL connection pooling and optimize pool recycling.',
            'priority': 'High',
            'status': 'In Progress',
            'order': 1,
            'assignee': users['dev1'],
            'due_date': today + timedelta(days=5),
            'comments': [
                (users['dev1'], 'We noticed connection saturation at 150 concurrent users. Increasing pool size to 50 and adding proxy layer.'),
                (users['manager'], 'This is our biggest roadblock right now; let us prioritize fixing this before stress testing.'),
            ]
        },
        {
            'project': projects['Project Alpha'],
            'title': 'Stripe Webhook Signature Verification',
            'description': 'Verify raw body payload signatures for incoming Stripe payment events to prevent spoofing and duplicate transaction receipts.',
            'priority': 'High',
            'status': 'In Review',
            'order': 0,
            'assignee': users['dev2'],
            'due_date': today + timedelta(days=2),
            'comments': [
                (users['manager'], 'Code looks solid. Staging webhook smoke tests completed with 100% pass rate.'),
                (users['dev2'], 'Added idempotency key checks to guard against replayed webhook notifications.'),
            ]
        },
        {
            'project': projects['Project Alpha'],
            'title': 'User Profile Multi-Factor Authentication',
            'description': 'Implement TOTP QR code generation and verification for mandatory two-factor authentication on financial withdrawals.',
            'priority': 'Medium',
            'status': 'Done',
            'order': 0,
            'assignee': users['dev2'],
            'due_date': today - timedelta(days=2),
            'comments': [
                (users['dev2'], 'Merged into staging branch and verified with Google Authenticator and Authy.'),
            ]
        },
        {
            'project': projects['Project Alpha'],
            'title': 'Export Transactions to Encrypted CSV/PDF',
            'description': 'Provide asynchronous report generator using background tasks for monthly client account statements.',
            'priority': 'Low',
            'status': 'Backlog',
            'order': 1,
            'assignee': users['dev1'],
            'due_date': today + timedelta(days=12),
            'comments': [
                (users['dev1'], 'Need to confirm password-protection specification for downloaded PDFs.'),
            ]
        },
        {
            'project': projects['Project Alpha'],
            'title': 'Automated Fraud Detection Thresholds',
            'description': 'Configure rule-based transaction velocity limits to flag suspicious multiple transfers exceeding $10,000 within 1 hour.',
            'priority': 'Urgent',
            'status': 'In Review',
            'order': 1,
            'assignee': users['dev2'],
            'due_date': today + timedelta(days=1),
            'comments': [
                (users['dev2'], 'Fraud rules benchmarked against 100k synthetic transfer events. False positive rate below 0.2%.'),
                (users['manager'], 'Great work Elena, please demo this at the sprint review tomorrow.'),
            ]
        },

        # ========================================================
        # Project Beta Tasks (Cloud Infrastructure Migration)
        # ========================================================
        {
            'project': projects['Project Beta'],
            'title': 'Kubernetes Helm Chart Deployment',
            'description': 'Construct Helm charts with horizontal pod autoscaling and ingress controllers for zero-downtime rolling updates.',
            'priority': 'High',
            'status': 'In Progress',
            'order': 0,
            'assignee': users['dev1'],
            'due_date': today + timedelta(days=4),
            'comments': [
                (users['dev1'], 'Configured resource limits: 500m CPU and 512Mi memory per replica.'),
                (users['manager'], 'Ensure HPA is set to scale out at 75% average CPU utilization.'),
            ]
        },
        {
            'project': projects['Project Beta'],
            'title': 'Database Schema Migration to Multi-AZ RDS',
            'description': 'Execute dry-run migration script for 50GB dataset with AWS DMS continuous replication and automated failover tests.',
            'priority': 'Urgent',
            'status': 'In Review',
            'order': 0,
            'assignee': users['dev2'],
            'due_date': today + timedelta(days=1),
            'comments': [
                (users['dev2'], 'Replication lag currently sits at 12ms. Looking good for final cutover.'),
            ]
        },
        {
            'project': projects['Project Beta'],
            'title': 'CI/CD Pipeline Security Scanning with Trivy',
            'description': 'Integrate static container vulnerability scanning on pull requests to prevent critical vulnerabilities entering production.',
            'priority': 'Medium',
            'status': 'Done',
            'order': 0,
            'assignee': users['dev1'],
            'due_date': today - timedelta(days=3),
            'comments': [
                (users['manager'], 'Zero high/critical CVEs policy enforced on main branch.'),
                (users['dev1'], 'All images now scanned during GitHub Actions workflow run.'),
            ]
        },
        {
            'project': projects['Project Beta'],
            'title': 'Terraform VPC & Subnet Provisioning',
            'description': 'Define dual-region private and public subnets with NAT gateways, route tables, and strict security group rules.',
            'priority': 'Medium',
            'status': 'Done',
            'order': 1,
            'assignee': users['dev2'],
            'due_date': today - timedelta(days=5),
            'comments': [
                (users['dev2'], 'Terraform plan applied successfully. All state locked in remote S3 bucket.'),
            ]
        },
        {
            'project': projects['Project Beta'],
            'title': 'Grafana & Prometheus Observability Dashboard',
            'description': 'Set up cluster metrics collection for pod memory, network throughput, and MySQL transaction latency with Slack alerting.',
            'priority': 'High',
            'status': 'Backlog',
            'order': 0,
            'assignee': users['dev1'],
            'due_date': today + timedelta(days=8),
            'comments': [
                (users['dev1'], 'Configuring Prometheus node exporters across all worker nodes.'),
            ]
        },

        # ========================================================
        # Project Gamma Tasks (AI Analytics & Mobile Engine)
        # ========================================================
        {
            'project': projects['Project Gamma'],
            'title': 'Design Categorization Prompt Architecture',
            'description': 'Formulate zero-shot prompt engineering for automatic merchant categorization and recurring bill detection.',
            'priority': 'High',
            'status': 'Backlog',
            'order': 0,
            'assignee': users['dev2'],
            'due_date': today + timedelta(days=14),
            'comments': [
                (users['dev2'], 'Testing few-shot prompts against Plaid and MX transaction datasets.'),
            ]
        },
        {
            'project': projects['Project Gamma'],
            'title': 'Mobile React Native Bridge Setup',
            'description': 'Initialize mobile repository with biometric FaceID/Fingerprint authentication and secure keychain token storage.',
            'priority': 'Medium',
            'status': 'In Progress',
            'order': 0,
            'assignee': users['dev1'],
            'due_date': today + timedelta(days=10),
            'comments': [
                (users['dev1'], 'Expo SDK 51 configured with native biometric prompts.'),
            ]
        },
    ]

    for t_data in tasks_data:
        comments = t_data.pop('comments', [])
        task, created = Task.objects.get_or_create(
            title=t_data['title'],
            project=t_data['project'],
            defaults=t_data
        )
        for k, v in t_data.items():
            setattr(task, k, v)
        task.save()

        # Add comments
        for author, msg in comments:
            TaskComment.objects.get_or_create(
                task=task,
                author=author,
                message=msg
            )
        status_txt = "Created" if created else "Updated"
        print(f"[{status_txt} Task #{task.id}] '{task.title}' | Project: {task.project.name} | Lane: {task.status} | Priority: {task.priority}")

    # 4. Trigger Vector Store Reindexing
    print("\n[RAG Engine] Starting semantic vector indexing across all tasks and comments...")
    store = get_vector_store()
    store.reindex_all()
    print(f"[RAG Engine] Vector indexing completed. Total indexed documents: {len(store.documents)}")
    print("=" * 60)
    print("PMS EXPANDED DATA SEED COMPLETED SUCCESSFULLY")
    print("=" * 60)

if __name__ == '__main__':
    seed()
