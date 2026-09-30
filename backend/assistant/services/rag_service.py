import os
import re
import json
from datetime import datetime, timedelta, date
from django.db import transaction
from django.utils import timezone
from .vector_store import get_vector_store
from projects.models import Project
from tasks.models import Task, TaskComment
from tasks.serializers import TaskSerializer
from accounts.models import User

def parse_relative_date(date_str: str) -> date:
    today = date.today()
    lower = date_str.lower().strip()
    if 'tomorrow' in lower:
        return today + timedelta(days=1)
    if 'next monday' in lower:
        days_ahead = (0 - today.weekday() + 7) % 7
        if days_ahead == 0:
            days_ahead = 7
        return today + timedelta(days=days_ahead)
    if 'next friday' in lower:
        days_ahead = (4 - today.weekday() + 7) % 7
        if days_ahead == 0:
            days_ahead = 7
        return today + timedelta(days=days_ahead)
    if 'next week' in lower:
        return today + timedelta(days=7)
    # Try YYYY-MM-DD
    match = re.search(r'\b(20\d\d-\d{1,2}-\d{1,2})\b', date_str)
    if match:
        try:
            return datetime.strptime(match.group(1), '%Y-%m-%d').date()
        except ValueError:
            pass
    # Default to 7 days from now
    return today + timedelta(days=7)

def execute_create_task(user, params, active_project_id=None):
    title = params.get('title', '').strip()
    description = params.get('description', '').strip()
    priority = params.get('priority', 'Medium')
    status = params.get('status', 'Backlog')
    due_date_str = params.get('due_date')
    assignee_val = params.get('assignee')
    project_identifier = params.get('project_id') or params.get('project_name') or active_project_id

    # Resolve project
    project = None
    if project_identifier:
        if isinstance(project_identifier, int) or (isinstance(project_identifier, str) and project_identifier.isdigit()):
            project = Project.objects.filter(id=int(project_identifier)).first()
        elif isinstance(project_identifier, str):
            project = Project.objects.filter(name__icontains=project_identifier).first()

    if not project:
        project = Project.objects.first()

    if not project:
        return None, "Error: No project found to assign the task to."

    # Normalize Priority
    valid_priorities = {'low': 'Low', 'medium': 'Medium', 'high': 'High', 'urgent': 'Urgent'}
    priority = valid_priorities.get(priority.lower(), 'Medium')

    # Normalize Status
    valid_statuses = {'backlog': 'Backlog', 'in progress': 'In Progress', 'in review': 'In Review', 'done': 'Done'}
    status = valid_statuses.get(status.lower().replace('_', ' '), 'Backlog')

    # Parse due date
    due_date = parse_relative_date(due_date_str) if due_date_str else date.today() + timedelta(days=7)

    # Resolve Assignee
    assignee = None
    if assignee_val:
        if isinstance(assignee_val, str) and '@' in assignee_val:
            assignee = User.objects.filter(email__iexact=assignee_val).first()
        elif isinstance(assignee_val, str):
            assignee = User.objects.filter(username__icontains=assignee_val).first() or \
                       User.objects.filter(first_name__icontains=assignee_val).first()

    # Determine order
    last_task = Task.objects.filter(project=project, status=status).order_by('-order').first()
    new_order = (last_task.order + 1) if last_task else 0

    with transaction.atomic():
        task = Task.objects.create(
            title=title or "Untitled Task",
            description=description,
            project=project,
            assignee=assignee,
            priority=priority,
            status=status,
            order=new_order,
            due_date=due_date
        )

    # Upsert vector index
    try:
        get_vector_store().upsert_task(task)
    except Exception as e:
        print(f"[VectorStore] Failed indexing task: {e}")

    serialized = TaskSerializer(task).data
    reply = f"Successfully created task **'{task.title}'** with **{task.priority}** priority in **{task.status}** lane for project **{project.name}**."
    return serialized, reply

def execute_update_task_status(params):
    task_id_or_title = params.get('task_id_or_title') or params.get('task_id') or params.get('title')
    new_status = params.get('new_status', 'In Progress')

    valid_statuses = {
        'backlog': 'Backlog',
        'in progress': 'In Progress',
        'in_progress': 'In Progress',
        'in review': 'In Review',
        'in_review': 'In Review',
        'done': 'Done',
        'completed': 'Done'
    }
    normalized_status = valid_statuses.get(str(new_status).lower().strip(), 'In Progress')

    task = None
    if str(task_id_or_title).isdigit():
        task = Task.objects.filter(id=int(task_id_or_title)).first()
    else:
        task = Task.objects.filter(title__icontains=str(task_id_or_title).strip()).first()

    if not task:
        return None, f"Could not find a task matching '{task_id_or_title}'."

    old_status = task.status
    task.status = normalized_status
    task.save()

    # Upsert vector index
    try:
        get_vector_store().upsert_task(task)
    except Exception as e:
        print(f"[VectorStore] Failed updating vector index: {e}")

    serialized = TaskSerializer(task).data
    reply = f"Updated task **'{task.title}'** status from **{old_status}** to **{task.status}**."
    return serialized, reply

def execute_query_metrics(project_id):
    project = None
    if project_id:
        project = Project.objects.filter(id=project_id).first()
    if not project:
        project = Project.objects.first()

    if not project:
        return "No projects found in the system."

    tasks = project.tasks.all()
    total = tasks.count()
    backlog = tasks.filter(status='Backlog').count()
    in_prog = tasks.filter(status='In Progress').count()
    in_rev = tasks.filter(status='In Review').count()
    done = tasks.filter(status='Done').count()
    urgent = tasks.filter(priority='Urgent').count()
    high = tasks.filter(priority='High').count()
    overdue = tasks.exclude(status='Done').filter(due_date__lt=date.today()).count()

    reply = (
        f"### Metrics for Project: **{project.name}**\n\n"
        f"- **Total Tasks**: {total}\n"
        f"- **Backlog**: {backlog}\n"
        f"- **In Progress**: {in_prog}\n"
        f"- **In Review**: {in_rev}\n"
        f"- **Done**: {done} ({(done/total*100):.1f}% completed)\n"
        f"- **Overdue Tasks**: {overdue}\n"
        f"- **High/Urgent Tasks**: {high + urgent}\n"
    )
    return reply

def detect_tool_intent(message: str, active_project_id: int = None):
    """
    Parses intent for tool execution.
    Supports create_task, update_task_status, query_project_metrics.
    """
    msg = message.strip()

    # 1. Detect CREATE TASK
    create_match = re.search(
        r'(?:create|add|make|insert|new)\s+(?:a\s+)?(?:task|ticket|item)\s*(?:called|named|titled)?\s*[\'"]?([^\'"]+?)[\'"]?(?:\s+due\s+([^\.]+?))?(?:\s+with\s+([^\.]+?)\s+priority)?(?:\.|$)',
        msg,
        re.IGNORECASE
    )
    
    # Alternative create pattern: "Create a High priority task called 'Setup Redis Caching' due next Monday"
    alt_create_match = re.search(
        r'(?:create|add|make)\s+(?:a\s+)?(low|medium|high|urgent)?\s*(?:priority\s+)?task\s+(?:called|named|titled)?\s*[\'"]([^\'"]+)[\'"](?:\s+due\s+([^\.\,\n]+))?',
        msg,
        re.IGNORECASE
    )

    if alt_create_match:
        priority = alt_create_match.group(1) or 'Medium'
        title = alt_create_match.group(2).strip()
        due_date = alt_create_match.group(3)
        return {
            'tool': 'create_task',
            'params': {
                'title': title,
                'priority': priority.capitalize() if priority else 'High',
                'due_date': due_date.strip() if due_date else None,
                'status': 'Backlog'
            }
        }

    if re.search(r'\b(?:create|add)\b.*\btask\b', msg, re.IGNORECASE):
        # Extract title
        title = None
        quoted = re.findall(r'[\'"]([^\'"]+)[\'"]', msg)
        if quoted:
            title = quoted[0]
        else:
            match = re.search(r'task\s+(?:called\s+|named\s+)?(.+?)(?:\s+due|\s+with|\s+priority|$)', msg, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
        
        priority = 'Medium'
        if re.search(r'\burgent\b', msg, re.IGNORECASE):
            priority = 'Urgent'
        elif re.search(r'\bhigh\b', msg, re.IGNORECASE):
            priority = 'High'
        elif re.search(r'\blow\b', msg, re.IGNORECASE):
            priority = 'Low'

        due_date = None
        due_match = re.search(r'\bdue\s+([^,\.\n]+)', msg, re.IGNORECASE)
        if due_match:
            due_date = due_match.group(1).strip()

        if title:
            return {
                'tool': 'create_task',
                'params': {
                    'title': title,
                    'priority': priority,
                    'due_date': due_date,
                    'status': 'Backlog'
                }
            }

    # 2. Detect UPDATE TASK STATUS
    update_match = re.search(
        r'(?:move|update|set|change)\s+(?:task\s+)?(?:#?(\d+)|[\'"]([^\'"]+)[\'"])\s+(?:to|as)\s+[\'"]?([a-zA-Z\s]+)[\'"]?',
        msg,
        re.IGNORECASE
    )
    if update_match:
        task_id = update_match.group(1)
        task_title = update_match.group(2)
        new_status = update_match.group(3).strip()
        return {
            'tool': 'update_task_status',
            'params': {
                'task_id_or_title': task_id or task_title,
                'new_status': new_status
            }
        }

    # 3. Detect QUERY METRICS
    if re.search(r'\b(?:metrics|progress|stats|status report|summary)\b', msg, re.IGNORECASE):
        return {
            'tool': 'query_project_metrics',
            'params': {'project_id': active_project_id}
        }

    return None

def synthesize_rag_answer(query: str, retrieved_docs: list, active_project_name: str = None) -> str:
    """
    Synthesizes a helpful grounded answer based on the retrieved task/comment documents.
    """
    if not retrieved_docs:
        return (
            "I couldn't find any specific tasks or comments matching your query in the current project knowledge base. "
            "Feel free to ask about project progress, recent discussions, or ask me to create new tasks!"
        )

    # Format the context
    context_sections = []
    for doc in retrieved_docs:
        meta = doc.get('metadata', {})
        context_sections.append(
            f"### {meta.get('title')} (Status: {meta.get('status')}, Priority: {meta.get('priority')})\n"
            f"{doc.get('text')}\n"
        )
    
    context_text = "\n---\n".join(context_sections)

    # Check for specific questions like "What issues are being discussed in Project Alpha?"
    if re.search(r'issues?|discussions?|roadblocks?|problems?|bugs?', query, re.IGNORECASE):
        topics = []
        for doc in retrieved_docs:
            text = doc.get('text', '')
            title = doc.get('metadata', {}).get('title', 'Unknown Task')
            # Extract comments
            if 'Comments / Discussions:' in text:
                parts = text.split('Comments / Discussions:')
                comments = parts[1].strip()
                if comments and 'No comments yet.' not in comments:
                    topics.append(f"- **{title}**:\n  {comments}")
                else:
                    topics.append(f"- **{title}**: {doc.get('metadata', {}).get('status')} lane. No blockers raised yet.")
        
        if topics:
            return (
                f"Based on the discussions and tasks retrieved from **{active_project_name or 'the project'}**:\n\n"
                + "\n\n".join(topics) +
                "\n\nLet me know if you would like me to create follow-up action items or update any task status!"
            )

    # Default informative grounded answer
    summary = f"Here is the relevant information retrieved from the knowledge base for **{active_project_name or 'your project'}**:\n\n"
    for doc in retrieved_docs:
        meta = doc.get('metadata', {})
        summary += f"- **Task #{meta.get('task_id')} - {meta.get('title')}**\n"
        summary += f"  - **Status**: `{meta.get('status')}` | **Priority**: `{meta.get('priority')}` | **Assignee**: `{meta.get('assignee')}`\n"
        # Extract description snippet
        text_lines = doc.get('text', '').split('\n')
        desc_lines = [l for l in text_lines if l.startswith('Description:')]
        if desc_lines:
            summary += f"  - *{desc_lines[0].replace('Description:', '').strip()}*\n"
    return summary

def process_chat_message(user, message: str, project_id: int = None):
    """
    Main entry point for /api/chat/ endpoint.
    Returns: { "reply": str, "action_performed": bool, "updated_task": dict or None, "action_type": str or None }
    """
    # 1. Determine active project
    active_project = None
    if project_id:
        active_project = Project.objects.filter(id=project_id).first()
    if not active_project:
        active_project = Project.objects.first()

    project_name = active_project.name if active_project else None

    # 2. Check for tool intent
    tool_intent = detect_tool_intent(message, active_project.id if active_project else None)

    if tool_intent:
        tool_name = tool_intent['tool']
        params = tool_intent['params']

        if tool_name == 'create_task':
            updated_task, reply = execute_create_task(user, params, active_project.id if active_project else None)
            return {
                'reply': reply,
                'action_performed': True,
                'action_type': 'CREATE_TASK',
                'updated_task': updated_task
            }

        elif tool_name == 'update_task_status':
            updated_task, reply = execute_update_task_status(params)
            return {
                'reply': reply,
                'action_performed': bool(updated_task),
                'action_type': 'UPDATE_TASK_STATUS',
                'updated_task': updated_task
            }

        elif tool_name == 'query_project_metrics':
            reply = execute_query_metrics(params.get('project_id'))
            return {
                'reply': reply,
                'action_performed': True,
                'action_type': 'QUERY_METRICS',
                'updated_task': None
            }

    # 3. If no tool intent, execute RAG Context Retrieval
    store = get_vector_store()
    retrieved_docs = store.query(message, project_id=active_project.id if active_project else None, top_k=4)

    reply = synthesize_rag_answer(message, retrieved_docs, active_project_name=project_name)

    return {
        'reply': reply,
        'action_performed': False,
        'action_type': 'RAG_QUERY',
        'updated_task': None
    }
