"""Seed default roles and permissions.

Run this after initial migration to populate the database with:
- 70 granular permissions across 9 groups
- 6 default roles (Super Admin, Admin, Power User, Developer, Analyst, Guest)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
from decimal import Decimal

from app.core.config import settings
from app.models.role import Role, Permission

# Create database session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Define all 70 permissions grouped by category
PERMISSIONS = [
    # Authentication & User Management
    {"name": "user.read.self", "group": "user", "display": "View own profile", "desc": "View own user profile"},
    {"name": "user.update.self", "group": "user", "display": "Update own profile", "desc": "Update own user profile"},
    {"name": "user.read.all", "group": "user", "display": "View all users", "desc": "View all user profiles"},
    {"name": "user.update.all", "group": "user", "display": "Update any user", "desc": "Update any user profile"},
    {"name": "user.create", "group": "user", "display": "Create users", "desc": "Create new users"},
    {"name": "user.delete", "group": "user", "display": "Delete users", "desc": "Delete user accounts"},
    {"name": "user.role.assign", "group": "user", "display": "Assign roles", "desc": "Assign roles to users"},
    {"name": "user.role.revoke", "group": "user", "display": "Revoke roles", "desc": "Revoke roles from users"},
    
    # Workspace Management
    {"name": "workspace.create", "group": "workspace", "display": "Create workspaces", "desc": "Create new workspaces"},
    {"name": "workspace.read.own", "group": "workspace", "display": "View own workspaces", "desc": "View own workspaces"},
    {"name": "workspace.read.all", "group": "workspace", "display": "View all workspaces", "desc": "View all workspaces"},
    {"name": "workspace.update.own", "group": "workspace", "display": "Modify own workspaces", "desc": "Modify own workspaces"},
    {"name": "workspace.update.all", "group": "workspace", "display": "Modify any workspace", "desc": "Modify any workspace"},
    {"name": "workspace.delete.own", "group": "workspace", "display": "Delete own workspaces", "desc": "Delete own workspaces"},
    {"name": "workspace.delete.all", "group": "workspace", "display": "Delete any workspace", "desc": "Delete any workspace"},
    {"name": "workspace.share", "group": "workspace", "display": "Share workspaces", "desc": "Share workspaces with others"},
    
    # AI Model Access
    {"name": "model.use.mini", "group": "model", "display": "Use mini models", "desc": "Use cheap models (gpt-4o-mini, haiku)"},
    {"name": "model.use.standard", "group": "model", "display": "Use standard models", "desc": "Use standard models (gpt-4o, sonnet)"},
    {"name": "model.use.premium", "group": "model", "display": "Use premium models", "desc": "Use premium models (opus, o1)"},
    {"name": "model.use.bedrock.gov", "group": "model", "display": "Use AWS Bedrock Gov", "desc": "Use AWS Bedrock Gov Cloud"},
    {"name": "model.use.azure.gov", "group": "model", "display": "Use Azure Gov", "desc": "Use Azure OpenAI Gov Cloud"},
    {"name": "model.use.anthropic", "group": "model", "display": "Use Anthropic", "desc": "Use Anthropic models"},
    {"name": "model.use.openai", "group": "model", "display": "Use OpenAI", "desc": "Use OpenAI models"},
    {"name": "model.use.local", "group": "model", "display": "Use local models", "desc": "Use local Ollama models"},
    
    # RAG & Knowledge
    {"name": "rag.query.skills", "group": "rag", "display": "Query skills", "desc": "Query skill knowledge base"},
    {"name": "rag.query.agents", "group": "rag", "display": "Query agents", "desc": "Query agent definitions"},
    {"name": "rag.query.workspace", "group": "rag", "display": "Query workspace", "desc": "Query own workspace content"},
    {"name": "rag.query.all", "group": "rag", "display": "Query all content", "desc": "Query all indexed content"},
    {"name": "rag.index.workspace", "group": "rag", "display": "Index workspace", "desc": "Index own workspace"},
    {"name": "rag.index.all", "group": "rag", "display": "Index all", "desc": "Index any workspace"},
    {"name": "rag.admin", "group": "rag", "display": "RAG admin", "desc": "Manage RAG collections"},
    
    # Agent Operations
    {"name": "agent.use.basic", "group": "agent", "display": "Use basic agents", "desc": "Use basic agents (coder, reviewer)"},
    {"name": "agent.use.advanced", "group": "agent", "display": "Use advanced agents", "desc": "Use advanced agents"},
    {"name": "agent.use.custom", "group": "agent", "display": "Use custom agents", "desc": "Use custom user-defined agents"},
    {"name": "agent.create", "group": "agent", "display": "Create agents", "desc": "Create custom agents"},
    {"name": "agent.delete.own", "group": "agent", "display": "Delete own agents", "desc": "Delete own custom agents"},
    {"name": "agent.delete.all", "group": "agent", "display": "Delete any agent", "desc": "Delete any custom agent"},
    {"name": "agent.admin", "group": "agent", "display": "Agent admin", "desc": "Manage agent registry"},
    
    # Cost & Quotas
    {"name": "quota.view.own", "group": "quota", "display": "View own quota", "desc": "View own usage and quota"},
    {"name": "quota.view.team", "group": "quota", "display": "View team quota", "desc": "View team usage"},
    {"name": "quota.view.all", "group": "quota", "display": "View all quotas", "desc": "View all user usage"},
    {"name": "quota.manage.own", "group": "quota", "display": "Manage own quota", "desc": "Manage own quota"},
    {"name": "quota.manage.team", "group": "quota", "display": "Manage team quotas", "desc": "Set team member quotas"},
    {"name": "quota.manage.all", "group": "quota", "display": "Manage all quotas", "desc": "Set any user quota"},
    {"name": "quota.unlimited", "group": "quota", "display": "Unlimited quota", "desc": "No quota enforcement"},
    {"name": "cost.export", "group": "quota", "display": "Export costs", "desc": "Export cost reports"},
    
    # Administration
    {"name": "admin.system.config", "group": "admin", "display": "System config", "desc": "Modify system configuration"},
    {"name": "admin.system.health", "group": "admin", "display": "System health", "desc": "View system health metrics"},
    {"name": "admin.logs.view", "group": "admin", "display": "View logs", "desc": "View system logs"},
    {"name": "admin.logs.export", "group": "admin", "display": "Export logs", "desc": "Export logs"},
    {"name": "admin.monitoring", "group": "admin", "display": "Monitoring", "desc": "Access monitoring dashboards"},
    {"name": "admin.security", "group": "admin", "display": "Security", "desc": "Manage security settings"},
    {"name": "admin.billing", "group": "admin", "display": "Billing", "desc": "Manage billing settings"},
    {"name": "admin.roles.create", "group": "admin", "display": "Create roles", "desc": "Create new roles"},
    {"name": "admin.roles.update", "group": "admin", "display": "Update roles", "desc": "Update role permissions"},
    {"name": "admin.roles.delete", "group": "admin", "display": "Delete roles", "desc": "Delete roles"},
    
    # Collaboration
    {"name": "collab.share.workspace", "group": "collab", "display": "Share workspace", "desc": "Share workspaces"},
    {"name": "collab.share.conversation", "group": "collab", "display": "Share conversation", "desc": "Share conversations"},
    {"name": "collab.share.agent", "group": "collab", "display": "Share agent", "desc": "Share custom agents"},
    {"name": "collab.view.shared", "group": "collab", "display": "View shared", "desc": "View items shared with user"},
    {"name": "collab.comment", "group": "collab", "display": "Comment", "desc": "Comment on shared items"},
    
    # Data & Compliance
    {"name": "data.export.own", "group": "data", "display": "Export own data", "desc": "Export own data"},
    {"name": "data.export.team", "group": "data", "display": "Export team data", "desc": "Export team data"},
    {"name": "data.export.all", "group": "data", "display": "Export all data", "desc": "Export all data"},
    {"name": "data.delete.own", "group": "data", "display": "Delete own data", "desc": "Delete own data"},
    {"name": "data.delete.all", "group": "data", "display": "Delete any data", "desc": "Delete any data"},
    {"name": "compliance.audit.view", "group": "data", "display": "View audit logs", "desc": "View audit logs"},
    {"name": "compliance.audit.export", "group": "data", "display": "Export audit logs", "desc": "Export audit logs"},
    {"name": "compliance.classify", "group": "data", "display": "Classify data", "desc": "Classify data (CUI, etc.)"},
]

def seed_permissions():
    """Create all permissions."""
    print("Seeding permissions...")
    permissions = {}
    for perm in PERMISSIONS:
        permission = Permission(
            id=uuid.uuid4(),
            name=perm["name"],
            group_name=perm["group"],
            display_name=perm["display"],
            description=perm["desc"]
        )
        db.add(permission)
        permissions[perm["name"]] = permission
    
    db.commit()
    print(f"✓ Created {len(PERMISSIONS)} permissions")
    return permissions

def seed_roles(permissions):
    """Create 6 default roles."""
    print("Seeding roles...")
    
    # Helper to get permission objects by name
    def get_perms(names):
        return [permissions[name] for name in names]
    
    # Super Admin - ALL permissions
    super_admin = Role(
        id=uuid.uuid4(),
        name="super_admin",
        display_name="Super Admin",
        description="Full system access, manages entire platform",
        is_system_role=True,
        quota_monthly_usd=Decimal("0"),  # Unlimited
        permissions=list(permissions.values())
    )
    db.add(super_admin)
    
    # Admin - Most permissions except system-critical
    admin_perms = [p for p in permissions.keys() if not p.startswith("admin.system.config")]
    admin = Role(
        id=uuid.uuid4(),
        name="admin",
        display_name="Admin",
        description="Manages organization/team, assigns roles, views costs",
        is_system_role=True,
        quota_monthly_usd=Decimal("5000.00"),
        permissions=get_perms(admin_perms)
    )
    db.add(admin)
    
    # Power User - All models and features
    power_user = Role(
        id=uuid.uuid4(),
        name="power_user",
        display_name="Power User",
        description="Advanced user with access to all models and features",
        is_system_role=True,
        quota_monthly_usd=Decimal("2000.00"),
        permissions=get_perms([
            "user.read.self", "user.update.self",
            "workspace.create", "workspace.read.own", "workspace.update.own", "workspace.delete.own", "workspace.share",
            "model.use.mini", "model.use.standard", "model.use.premium", "model.use.bedrock.gov", "model.use.azure.gov",
            "model.use.anthropic", "model.use.openai", "model.use.local",
            "rag.query.skills", "rag.query.agents", "rag.query.workspace", "rag.query.all", "rag.index.workspace",
            "agent.use.basic", "agent.use.advanced", "agent.use.custom", "agent.create", "agent.delete.own",
            "quota.view.own", "cost.export",
            "collab.share.workspace", "collab.share.conversation", "collab.share.agent", "collab.view.shared", "collab.comment",
            "data.export.own", "data.delete.own"
        ])
    )
    db.add(power_user)
    
    # Developer - Code-focused, standard access
    developer = Role(
        id=uuid.uuid4(),
        name="developer",
        display_name="Developer",
        description="Standard engineering user, code-focused workflows",
        is_system_role=True,
        quota_monthly_usd=Decimal("500.00"),
        permissions=get_perms([
            "user.read.self", "user.update.self",
            "workspace.create", "workspace.read.own", "workspace.update.own", "workspace.delete.own",
            "model.use.mini", "model.use.standard", "model.use.bedrock.gov",
            "rag.query.skills", "rag.query.agents", "rag.query.workspace", "rag.index.workspace",
            "agent.use.basic", "agent.use.advanced",
            "quota.view.own",
            "collab.share.workspace", "collab.view.shared",
            "data.export.own"
        ])
    )
    db.add(developer)
    
    # Analyst - Read-focused, limited access
    analyst = Role(
        id=uuid.uuid4(),
        name="analyst",
        display_name="Analyst",
        description="Read-focused user, research and analysis workflows",
        is_system_role=True,
        quota_monthly_usd=Decimal("200.00"),
        permissions=get_perms([
            "user.read.self", "user.update.self",
            "workspace.create", "workspace.read.own", "workspace.update.own", "workspace.delete.own",
            "model.use.mini", "model.use.standard",
            "rag.query.skills", "rag.query.workspace",
            "agent.use.basic",
            "quota.view.own",
            "collab.view.shared",
            "data.export.own"
        ])
    )
    db.add(analyst)
    
    # Guest - Limited trial access
    guest = Role(
        id=uuid.uuid4(),
        name="guest",
        display_name="Guest",
        description="Limited trial access for evaluation",
        is_system_role=True,
        quota_monthly_usd=Decimal("50.00"),
        permissions=get_perms([
            "user.read.self",
            "workspace.create", "workspace.read.own",
            "model.use.mini",
            "rag.query.skills",
            "agent.use.basic",
            "quota.view.own",
            "collab.view.shared"
        ])
    )
    db.add(guest)
    
    db.commit()
    print("✓ Created 6 default roles")
    print("  - Super Admin (unlimited quota, all permissions)")
    print("  - Admin ($5K/month, team management)")
    print("  - Power User ($2K/month, all models)")
    print("  - Developer ($500/month, standard access)")
    print("  - Analyst ($200/month, read-focused)")
    print("  - Guest ($50/month, trial access)")

def main():
    try:
        print("Starting database seed...")
        permissions = seed_permissions()
        seed_roles(permissions)
        print("\n✓ Database seeded successfully!")
    except Exception as e:
        print(f"\n✗ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
