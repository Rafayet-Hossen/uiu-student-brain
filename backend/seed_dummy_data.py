import os
import sys
from datetime import date, time, timedelta

import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User
from community.models import Comment, EventRSVP, Follow, LeaderboardProfile, Post, Reaction, StudyEvent
from grades.models import GradePlan
from planner.models import Schedule
from tracker.models import StudyGoal, StudySession


def seed():
    print("🌱 Starting database seeding with realistic academic demo accounts...")

    today = date.today()

    users_data = [
        {
            "email": "alex.rivera@example.com",
            "password": "Password123!",
            "full_name": "Alex Rivera",
            "quote": "Code, debug, repeat until mastery.",
            "opt_in": True,
            "goal": 90,
            "grade_plan": {
                "name": "Computer Science B.S.",
                "current_gpa": "3.72",
                "target_gpa": "3.85",
                "completed_credits": 78,
                "total_credits": 120,
            },
            "schedules": [
                {
                    "subject": "Data Structures & Algorithms",
                    "start_time": time(9, 0),
                    "end_time": time(11, 0),
                    "days": ["Monday", "Wednesday", "Friday"],
                    "deadline": today + timedelta(days=14),
                },
                {
                    "subject": "Operating Systems",
                    "start_time": time(14, 0),
                    "end_time": time(16, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=21),
                },
                {
                    "subject": "Database Management Systems",
                    "start_time": time(16, 30),
                    "end_time": time(18, 0),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=28),
                },
            ],
            "sessions": [
                {"subject": "Data Structures & Algorithms", "mins": 120, "days_ago": 0, "notes": "Solved dynamic programming graph problems."},
                {"subject": "Operating Systems", "mins": 90, "days_ago": 0, "notes": "Implemented process scheduling algorithms in C."},
                {"subject": "Data Structures & Algorithms", "mins": 100, "days_ago": 1, "notes": "Tree traversals and Dijkstra shortest paths."},
                {"subject": "Database Management Systems", "mins": 80, "days_ago": 2, "notes": "SQL indexing and B-tree optimization analysis."},
                {"subject": "Operating Systems", "mins": 110, "days_ago": 3, "notes": "Virtual memory paging simulation."},
                {"subject": "Data Structures & Algorithms", "mins": 90, "days_ago": 4, "notes": "Red-Black tree rebalancing and rotations."},
                {"subject": "Database Management Systems", "mins": 75, "days_ago": 5, "notes": "ACID transaction isolation levels."},
                {"subject": "Data Structures & Algorithms", "mins": 120, "days_ago": 6, "notes": "Competitive programming weekly contest."},
                {"subject": "Operating Systems", "mins": 90, "days_ago": 7, "notes": "Kernel thread synchronization with semaphores."},
                {"subject": "Machine Learning", "mins": 150, "days_ago": 9, "notes": "Gradient descent and neural net backpropagation."},
            ],
        },
        {
            "email": "sarah.chen@example.com",
            "password": "Password123!",
            "full_name": "Sarah Chen",
            "quote": "Small daily steps lead to huge academic leaps.",
            "opt_in": True,
            "goal": 120,
            "grade_plan": {
                "name": "Pre-Med & Neurobiology",
                "current_gpa": "3.91",
                "target_gpa": "3.95",
                "completed_credits": 96,
                "total_credits": 120,
            },
            "schedules": [
                {
                    "subject": "Organic Chemistry II",
                    "start_time": time(8, 30),
                    "end_time": time(10, 30),
                    "days": ["Monday", "Wednesday", "Friday"],
                    "deadline": today + timedelta(days=10),
                },
                {
                    "subject": "Molecular Neurobiology",
                    "start_time": time(11, 0),
                    "end_time": time(13, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=18),
                },
            ],
            "sessions": [
                {"subject": "Organic Chemistry II", "mins": 150, "days_ago": 0, "notes": "Reaction mechanisms for aromatic substitution."},
                {"subject": "Molecular Neurobiology", "mins": 120, "days_ago": 0, "notes": "Synaptic transmission and neurotransmitter receptors."},
                {"subject": "Organic Chemistry II", "mins": 140, "days_ago": 1, "notes": "Aldol condensation synthesis pathways."},
                {"subject": "Molecular Neurobiology", "mins": 130, "days_ago": 2, "notes": "Action potential propagation and patch-clamp recording."},
                {"subject": "Genetics", "mins": 100, "days_ago": 3, "notes": "CRISPR gene editing mechanisms."},
                {"subject": "Organic Chemistry II", "mins": 160, "days_ago": 4, "notes": "NMR Spectroscopy interpretation drills."},
                {"subject": "Molecular Neurobiology", "mins": 120, "days_ago": 5, "notes": "Neural plasticity and long-term potentiation."},
                {"subject": "Genetics", "mins": 90, "days_ago": 6, "notes": "Population genetics and Hardy-Weinberg equilibrium."},
                {"subject": "Organic Chemistry II", "mins": 180, "days_ago": 8, "notes": "Comprehensive mid-semester exam review."},
            ],
        },
        {
            "email": "marcus.vance@example.com",
            "password": "Password123!",
            "full_name": "Marcus Vance",
            "quote": "Measure twice, optimize once.",
            "opt_in": True,
            "goal": 60,
            "grade_plan": {
                "name": "Mechanical Engineering B.S.",
                "current_gpa": "3.45",
                "target_gpa": "3.65",
                "completed_credits": 52,
                "total_credits": 128,
            },
            "schedules": [
                {
                    "subject": "Thermodynamics & Heat Transfer",
                    "start_time": time(10, 0),
                    "end_time": time(12, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=12),
                },
                {
                    "subject": "CAD & Engineering Design",
                    "start_time": time(14, 0),
                    "end_time": time(17, 0),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=25),
                },
            ],
            "sessions": [
                {"subject": "Thermodynamics & Heat Transfer", "mins": 90, "days_ago": 0, "notes": "Rankine and Brayton cycle efficiency calculations."},
                {"subject": "CAD & Engineering Design", "mins": 110, "days_ago": 1, "notes": "Parametric solid modeling of gearbox assembly."},
                {"subject": "Thermodynamics & Heat Transfer", "mins": 80, "days_ago": 2, "notes": "Entropy balance equations for open systems."},
                {"subject": "Calculus III", "mins": 75, "days_ago": 3, "notes": "Triple integrals in cylindrical coordinates."},
                {"subject": "CAD & Engineering Design", "mins": 120, "days_ago": 5, "notes": "Stress analysis with FEA simulation."},
            ],
        },
        {
            "email": "elena.rostova@example.com",
            "password": "Password123!",
            "full_name": "Elena Rostova",
            "quote": "Mathematics is the poetry of logical ideas.",
            "opt_in": True,
            "goal": 90,
            "grade_plan": {
                "name": "Pure Mathematics & Statistics",
                "current_gpa": "3.96",
                "target_gpa": "3.98",
                "completed_credits": 88,
                "total_credits": 120,
            },
            "schedules": [
                {
                    "subject": "Abstract Algebra",
                    "start_time": time(9, 30),
                    "end_time": time(11, 30),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=15),
                },
                {
                    "subject": "Real Analysis",
                    "start_time": time(13, 0),
                    "end_time": time(15, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=22),
                },
            ],
            "sessions": [
                {"subject": "Abstract Algebra", "mins": 110, "days_ago": 0, "notes": "Sylow theorems and group homomorphism kernels."},
                {"subject": "Real Analysis", "mins": 100, "days_ago": 1, "notes": "Lebesgue integration and dominated convergence theorem."},
                {"subject": "Abstract Algebra", "mins": 95, "days_ago": 2, "notes": "Ring isomorphism theorems and maximal ideals."},
                {"subject": "Real Analysis", "mins": 120, "days_ago": 3, "notes": "Metric space compactness and Heine-Borel theorem."},
                {"subject": "Probability Theory", "mins": 85, "days_ago": 4, "notes": "Measure-theoretic probability and martingales."},
                {"subject": "Abstract Algebra", "mins": 105, "days_ago": 5, "notes": "Galois theory and polynomial solvability by radicals."},
            ],
        },
    ]

    created_users = []

    for udata in users_data:
        # Create or update user
        user, created = User.objects.get_or_create(
            email=udata["email"],
            defaults={"full_name": udata["full_name"]},
        )
        user.set_password(udata["password"])
        user.full_name = udata["full_name"]
        user.save()
        created_users.append(user)

        # Leaderboard Profile
        LeaderboardProfile.objects.update_or_create(
            user=user,
            defaults={"is_opted_in": udata["opt_in"], "custom_quote": udata["quote"]},
        )

        # Study Goal
        StudyGoal.objects.update_or_create(
            user=user,
            defaults={"daily_goal_minutes": udata["goal"]},
        )

        # Grade Plan
        gp_data = udata["grade_plan"]
        GradePlan.objects.update_or_create(
            user=user,
            defaults={
                "name": gp_data["name"],
                "current_gpa": gp_data["current_gpa"],
                "target_gpa": gp_data["target_gpa"],
                "completed_credits": gp_data["completed_credits"],
                "total_credits": gp_data["total_credits"],
            },
        )

        # Planner Schedules
        Schedule.objects.filter(user=user).delete()
        for s in udata["schedules"]:
            Schedule.objects.create(
                user=user,
                subject=s["subject"],
                start_time=s["start_time"],
                end_time=s["end_time"],
                days=s["days"],
                deadline=s["deadline"],
            )

        # Tracker Study Sessions
        StudySession.objects.filter(user=user).delete()
        for sess in udata["sessions"]:
            session_date = today - timedelta(days=sess["days_ago"])
            StudySession.objects.create(
                user=user,
                subject=sess["subject"],
                duration_minutes=sess["mins"],
                session_date=session_date,
                notes=sess["notes"],
            )

    # Setup Social Graph / Follows
    Follow.objects.all().delete()
    if len(created_users) >= 4:
        alex, sarah, marcus, elena = created_users[0], created_users[1], created_users[2], created_users[3]
        Follow.objects.create(follower=alex, following=sarah)
        Follow.objects.create(follower=alex, following=elena)
        Follow.objects.create(follower=sarah, following=alex)
        Follow.objects.create(follower=sarah, following=elena)
        Follow.objects.create(follower=marcus, following=alex)
        Follow.objects.create(follower=elena, following=sarah)

    # Setup Community Discussions
    Post.objects.all().delete()
    p1 = Post.objects.create(
        author=created_users[1], # Sarah
        title="Best strategies for mastering Organic Synthesis reactions?",
        content="I find drawing the full electron-pushing arrows and practicing 5 synthesis roadmaps every morning makes a massive difference. What is everyone else's favorite technique?",
        category="Exam Prep",
    )
    p2 = Post.objects.create(
        author=created_users[0], # Alex
        title="Curated list of Algorithm visualization and practice tools",
        content="Hey everyone! For DSA prep, visualgo.net and NeetCode roadmaps are incredible. Let me know if you want to organize a weekend LeetCode mock interview session!",
        category="Resources",
    )
    p3 = Post.objects.create(
        author=created_users[2], # Marcus
        title="SolidWorks vs Fusion 360 for mechanical design projects?",
        content="Starting our robotics capstone design. Which CAD package do you find more intuitive for FEA simulations and complex assemblies?",
        category="Study Group",
    )

    # Reactions & Comments
    Reaction.objects.create(post=p1, user=created_users[0])
    Reaction.objects.create(post=p1, user=created_users[3])
    Reaction.objects.create(post=p2, user=created_users[1])
    Reaction.objects.create(post=p2, user=created_users[2])
    Reaction.objects.create(post=p2, user=created_users[3])

    Comment.objects.create(
        post=p1,
        author=created_users[0],
        content="Flashcards with reaction mechanisms on Anki helped me memorize the reagents!",
    )
    Comment.objects.create(
        post=p2,
        author=created_users[3],
        content="Count me in for the LeetCode mock interviews! Graph algorithms especially.",
    )

    # Study Events
    StudyEvent.objects.all().delete()
    e1 = StudyEvent.objects.create(
        creator=created_users[0], # Alex
        title="Weekly LeetCode & Algorithms Problem Solving",
        description="We will solve 3 medium problems together on dynamic programming and graphs with live code review.",
        subject="Computer Science",
        event_date=today + timedelta(days=2),
        start_time=time(17, 0),
        end_time=time(19, 0),
        location="Science & Tech Library - Study Room 402 / Discord",
    )
    e2 = StudyEvent.objects.create(
        creator=created_users[1], # Sarah
        title="Organic Chemistry Midterm Rapid Fire Review",
        description="High-yield synthesis problem solving and NMR spectra interpretation session.",
        subject="Chemistry",
        event_date=today + timedelta(days=4),
        start_time=time(15, 0),
        end_time=time(17, 30),
        location="Life Sciences Building - Hall B",
    )

    EventRSVP.objects.create(event=e1, user=created_users[0], status="going")
    EventRSVP.objects.create(event=e1, user=created_users[1], status="going")
    EventRSVP.objects.create(event=e1, user=created_users[3], status="going")
    EventRSVP.objects.create(event=e2, user=created_users[1], status="going")
    EventRSVP.objects.create(event=e2, user=created_users[0], status="going")

    print("✨ Successfully generated 4 demo accounts with full study tracker, streaks, routines, grades, and community data!")
    print("----------------------------------------------------------------------")
    print("Demo Account Logins (Password for all: 'Password123!'):")
    print("1. Sarah Chen     -> sarah.chen@example.com    (Top Leaderboard / Pre-Med)")
    print("2. Alex Rivera    -> alex.rivera@example.com   (CS / Algorithms Scholar)")
    print("3. Elena Rostova  -> elena.rostova@example.com  (Pure Math / 4.0 GPA)")
    print("4. Marcus Vance   -> marcus.vance@example.com  (Engineering Builder)")
    print("----------------------------------------------------------------------")


if __name__ == "__main__":
    seed()
