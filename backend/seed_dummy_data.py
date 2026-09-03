import os
import sys
from datetime import date, time, timedelta

import django
from django.utils import timezone

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User
from community.models import Comment, EventRSVP, Follow, LeaderboardProfile, Post, Reaction, StudyEvent
from grades.models import GradePlan
from materials.models import StudyMaterial, StudyProject
from planner.models import Schedule
from tracker.models import StudyGoal, StudySession


def seed():
    print("🌱 Seeding database with authentic Bangladeshi scholar demo accounts...")

    today = date.today()

    users_data = [
        {
            "email": "jamil.hossain@example.com",
            "password": "Password123!",
            "full_name": "Jamil Hossain",
            "quote": "পরিশ্রম কখনো বৃথা যায় না। Consistency is key.",
            "opt_in": True,
            "goal": 120,
            "grade_plan": {
                "name": "Computer Science & Engineering B.Sc.",
                "current_gpa": "3.88",
                "target_gpa": "3.95",
                "completed_credits": 92,
                "total_credits": 140,
            },
            "schedules": [
                {
                    "subject": "Data Structures & Algorithms",
                    "start_time": time(9, 0),
                    "end_time": time(11, 0),
                    "days": ["Monday", "Wednesday", "Friday"],
                    "deadline": today + timedelta(days=12),
                },
                {
                    "subject": "Operating Systems & System Programming",
                    "start_time": time(14, 0),
                    "end_time": time(16, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=20),
                },
                {
                    "subject": "Database Management Systems",
                    "start_time": time(16, 30),
                    "end_time": time(18, 0),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=26),
                },
            ],
            "sessions": [
                {"subject": "Data Structures & Algorithms", "mins": 140, "days_ago": 0, "notes": "Dynamic Programming, DP on Trees, and Graph BFS/DFS drills."},
                {"subject": "Operating Systems & System Programming", "mins": 110, "days_ago": 0, "notes": "Thread synchronization with Mutex locks and semaphores."},
                {"subject": "Data Structures & Algorithms", "mins": 120, "days_ago": 1, "notes": "Dijkstra and Bellman-Ford shortest path algorithms."},
                {"subject": "Database Management Systems", "mins": 95, "days_ago": 2, "notes": "B-Tree indexing and query execution plan tuning."},
                {"subject": "Operating Systems & System Programming", "mins": 130, "days_ago": 3, "notes": "Page replacement algorithms (LRU, Clock) simulation."},
                {"subject": "Data Structures & Algorithms", "mins": 110, "days_ago": 4, "notes": "Segment Tree with Lazy Propagation implementation."},
                {"subject": "Database Management Systems", "mins": 85, "days_ago": 5, "notes": "Transaction isolation levels (Serializable, Snapshot)."},
                {"subject": "Data Structures & Algorithms", "mins": 150, "days_ago": 6, "notes": "Codeforces Div 2 weekly contest problem solving."},
                {"subject": "Machine Learning", "mins": 120, "days_ago": 8, "notes": "Linear Regression and Stochastic Gradient Descent."},
            ],
        },
        {
            "email": "baitun.bithy@example.com",
            "password": "Password123!",
            "full_name": "Baitun Nahar Bithy",
            "quote": "Success is the sum of small efforts repeated daily.",
            "opt_in": True,
            "goal": 150,
            "grade_plan": {
                "name": "Biochemistry & Molecular Biology",
                "current_gpa": "3.94",
                "target_gpa": "3.98",
                "completed_credits": 105,
                "total_credits": 140,
            },
            "schedules": [
                {
                    "subject": "Organic Chemistry & Synthesis",
                    "start_time": time(8, 30),
                    "end_time": time(10, 30),
                    "days": ["Monday", "Wednesday", "Friday"],
                    "deadline": today + timedelta(days=10),
                },
                {
                    "subject": "Molecular Genetics",
                    "start_time": time(11, 0),
                    "end_time": time(13, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=18),
                },
            ],
            "sessions": [
                {"subject": "Organic Chemistry & Synthesis", "mins": 160, "days_ago": 0, "notes": "Electrophilic aromatic substitution reaction mechanisms."},
                {"subject": "Molecular Genetics", "mins": 130, "days_ago": 0, "notes": "CRISPR-Cas9 gene editing and RNA interference."},
                {"subject": "Organic Chemistry & Synthesis", "mins": 150, "days_ago": 1, "notes": "Aldol and Claisen condensation pathways."},
                {"subject": "Molecular Genetics", "mins": 140, "days_ago": 2, "notes": "DNA replication fork machinery and proofreading."},
                {"subject": "Cellular Biology", "mins": 110, "days_ago": 3, "notes": "Mitochondrial electron transport chain complexes."},
                {"subject": "Organic Chemistry & Synthesis", "mins": 170, "days_ago": 4, "notes": "Proton and Carbon-13 NMR spectra interpretation drills."},
                {"subject": "Molecular Genetics", "mins": 125, "days_ago": 5, "notes": "Lac operon and eukaryotic transcription factors."},
                {"subject": "Cellular Biology", "mins": 95, "days_ago": 6, "notes": "Signal transduction via G-protein coupled receptors."},
                {"subject": "Organic Chemistry & Synthesis", "mins": 180, "days_ago": 7, "notes": "Comprehensive mid-semester organic chemistry review."},
            ],
        },
        {
            "email": "saptarshi.supty@example.com",
            "password": "Password123!",
            "full_name": "Saptarshi Biswas Supty",
            "quote": "Mathematics is not about numbers, it is about understanding.",
            "opt_in": True,
            "goal": 90,
            "grade_plan": {
                "name": "Applied Mathematics & Statistics",
                "current_gpa": "3.92",
                "target_gpa": "3.96",
                "completed_credits": 84,
                "total_credits": 130,
            },
            "schedules": [
                {
                    "subject": "Real Analysis & Topology",
                    "start_time": time(9, 30),
                    "end_time": time(11, 30),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=15),
                },
                {
                    "subject": "Abstract Algebra",
                    "start_time": time(13, 0),
                    "end_time": time(15, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=22),
                },
            ],
            "sessions": [
                {"subject": "Real Analysis & Topology", "mins": 120, "days_ago": 0, "notes": "Lebesgue measure and Dominated Convergence Theorem."},
                {"subject": "Abstract Algebra", "mins": 105, "days_ago": 1, "notes": "Sylow p-subgroups and simple group classifications."},
                {"subject": "Real Analysis & Topology", "mins": 115, "days_ago": 2, "notes": "Compactness, Heine-Borel theorem in metric spaces."},
                {"subject": "Abstract Algebra", "mins": 130, "days_ago": 3, "notes": "Ring isomorphism theorems, prime and maximal ideals."},
                {"subject": "Probability & Stochastic Processes", "mins": 90, "days_ago": 4, "notes": "Markov chains and stationary transition matrices."},
                {"subject": "Real Analysis & Topology", "mins": 110, "days_ago": 5, "notes": "Uniform convergence and equicontinuity (Arzelà-Ascoli)."},
            ],
        },
        {
            "email": "shourav.shah@example.com",
            "password": "Password123!",
            "full_name": "Shourav Shah",
            "quote": "Dream big, study focused, execute daily.",
            "opt_in": True,
            "goal": 80,
            "grade_plan": {
                "name": "Software Engineering B.Sc.",
                "current_gpa": "3.65",
                "target_gpa": "3.80",
                "completed_credits": 70,
                "total_credits": 140,
            },
            "schedules": [
                {
                    "subject": "Web Architectures & Cloud Computing",
                    "start_time": time(10, 0),
                    "end_time": time(12, 0),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=16),
                },
                {
                    "subject": "Distributed Systems",
                    "start_time": time(15, 0),
                    "end_time": time(17, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=24),
                },
            ],
            "sessions": [
                {"subject": "Web Architectures & Cloud Computing", "mins": 100, "days_ago": 0, "notes": "Microservices communication with gRPC and REST APIs."},
                {"subject": "Distributed Systems", "mins": 90, "days_ago": 1, "notes": "Raft consensus protocol leader election implementation."},
                {"subject": "Web Architectures & Cloud Computing", "mins": 110, "days_ago": 2, "notes": "PostgreSQL replication and connection pooling with PgBouncer."},
                {"subject": "Distributed Systems", "mins": 85, "days_ago": 3, "notes": "CAP theorem and eventual consistency tradeoffs."},
                {"subject": "Cloud Computing", "mins": 95, "days_ago": 5, "notes": "Kubernetes Pod lifecycle and service mesh ingress."},
            ],
        },
        {
            "email": "rayhan.chowdhury@example.com",
            "password": "Password123!",
            "full_name": "Rayhan Chowdhury",
            "quote": "Building machines that shape the future.",
            "opt_in": True,
            "goal": 75,
            "grade_plan": {
                "name": "Mechanical & Mechatronics Engineering",
                "current_gpa": "3.52",
                "target_gpa": "3.70",
                "completed_credits": 64,
                "total_credits": 144,
            },
            "schedules": [
                {
                    "subject": "Thermodynamics & Fluid Mechanics",
                    "start_time": time(9, 0),
                    "end_time": time(11, 0),
                    "days": ["Tuesday", "Thursday"],
                    "deadline": today + timedelta(days=14),
                },
                {
                    "subject": "Robotics & Microcontroller Systems",
                    "start_time": time(14, 0),
                    "end_time": time(17, 0),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=28),
                },
            ],
            "sessions": [
                {"subject": "Thermodynamics & Fluid Mechanics", "mins": 95, "days_ago": 0, "notes": "Navier-Stokes equations and boundary layer separation."},
                {"subject": "Robotics & Microcontroller Systems", "mins": 120, "days_ago": 1, "notes": "PID controller tuning for quadcopter attitude stabilization."},
                {"subject": "Thermodynamics & Fluid Mechanics", "mins": 80, "days_ago": 2, "notes": "Brayton cycle regenerative gas turbine efficiency."},
                {"subject": "Robotics & Microcontroller Systems", "mins": 100, "days_ago": 4, "notes": "Forward and inverse kinematics for 6-DOF robotic arm."},
            ],
        },
        {
            "email": "rafiq.mustafa@example.com",
            "password": "Password123!",
            "full_name": "Rafiq Al Mustafa",
            "quote": "Knowledge is power, but focus is superpowers.",
            "opt_in": True,
            "goal": 60,
            "grade_plan": {
                "name": "Electrical & Electronic Engineering (EEE)",
                "current_gpa": "3.60",
                "target_gpa": "3.75",
                "completed_credits": 60,
                "total_credits": 144,
            },
            "schedules": [
                {
                    "subject": "Signals & Linear Systems",
                    "start_time": time(10, 30),
                    "end_time": time(12, 30),
                    "days": ["Monday", "Wednesday"],
                    "deadline": today + timedelta(days=12),
                },
            ],
            "sessions": [
                {"subject": "Signals & Linear Systems", "mins": 85, "days_ago": 0, "notes": "Fourier Transform and Laplace domain filter design."},
                {"subject": "Signals & Linear Systems", "mins": 90, "days_ago": 1, "notes": "Z-transform and discrete-time convolution."},
                {"subject": "Semiconductor Devices", "mins": 75, "days_ago": 3, "notes": "MOSFET I-V characteristic curves and bandgap physics."},
            ],
        },
        {
            "email": "shofiqur.rahaman@example.com",
            "password": "Password123!",
            "full_name": "Shofiqur Rahaman",
            "quote": "Every master was once a beginner. Keep learning.",
            "opt_in": True,
            "goal": 60,
            "grade_plan": {
                "name": "Economics & Data Analytics",
                "current_gpa": "3.48",
                "target_gpa": "3.65",
                "completed_credits": 48,
                "total_credits": 120,
            },
            "schedules": [
                {
                    "subject": "Econometrics & Quantitative Finance",
                    "start_time": time(11, 0),
                    "end_time": time(13, 0),
                    "days": ["Sunday", "Tuesday"],
                    "deadline": today + timedelta(days=15),
                },
            ],
            "sessions": [
                {"subject": "Econometrics & Quantitative Finance", "mins": 70, "days_ago": 0, "notes": "Ordinary Least Squares (OLS) regression assumptions."},
                {"subject": "Microeconomic Theory", "mins": 80, "days_ago": 2, "notes": "Consumer utility maximization and Lagrange multipliers."},
            ],
        },
    ]

    created_users = []

    for udata in users_data:
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

    # Social Graph / Network
    Follow.objects.all().delete()
    jamil, bithy, supty, shourav, rayhan, rafiq, shofiqur = created_users
    Follow.objects.create(follower=jamil, following=bithy)
    Follow.objects.create(follower=jamil, following=supty)
    Follow.objects.create(follower=jamil, following=shourav)
    Follow.objects.create(follower=bithy, following=jamil)
    Follow.objects.create(follower=bithy, following=supty)
    Follow.objects.create(follower=supty, following=jamil)
    Follow.objects.create(follower=supty, following=bithy)
    Follow.objects.create(follower=shourav, following=jamil)
    Follow.objects.create(follower=rayhan, following=shourav)
    Follow.objects.create(follower=rafiq, following=rayhan)
    Follow.objects.create(follower=shofiqur, following=jamil)

    # Community Discussions
    Post.objects.all().delete()
    p1 = Post.objects.create(
        author=bithy,
        title="Best resources for Organic Chemistry mechanism visualization?",
        content="আমি Organic Chemistry-এর Reaction Mechanisms মনে রাখার জন্য 3D molecular visualization টুলস এবং প্রতিদিন সকালে ৫টা সিন্থেসিস প্র্যাকটিস করছি। কারো ভালো কোনো অ্যানিমেশন সাইটের লিংক থাকলে শেয়ার করবেন?",
        category="Resources",
    )
    p2 = Post.objects.create(
        author=jamil,
        title="Weekly LeetCode & DSA Problem Solving Group",
        content="Hello everyone! We are organizing a weekly competitive programming problem solving session covering Dynamic Programming, Segment Trees, and Graph Algorithms. Let me know if you want to join our live session!",
        category="Study Group",
    )
    p3 = Post.objects.create(
        author=supty,
        title="Tips for tackling Real Analysis proofs and topological concepts",
        content="Real Analysis-এ epsilon-delta ডেফিনিশন এবং compactness কনসেপ্ট ভিজ্যুয়ালাইজ করার জন্য Abbott-এর Understanding Analysis বইটা খুবই হেল্পফুল। কারো কোনো পার্টিকুলার প্রুফে সমস্যা হলে ডিসকাস করতে পারেন!",
        category="Course Help",
    )
    p4 = Post.objects.create(
        author=rayhan,
        title="SolidWorks vs Fusion 360 for Robotics & Mechatronics Projects?",
        content="Looking for recommendations on mechanical CAD modeling. Which software gives smoother FEA stress simulations for robot arm joints?",
        category="General",
    )

    # Reactions & Comments
    Reaction.objects.create(post=p1, user=jamil)
    Reaction.objects.create(post=p1, user=supty)
    Reaction.objects.create(post=p1, user=shourav)
    Reaction.objects.create(post=p2, user=bithy)
    Reaction.objects.create(post=p2, user=supty)
    Reaction.objects.create(post=p2, user=shourav)
    Reaction.objects.create(post=p2, user=rayhan)
    Reaction.objects.create(post=p3, user=jamil)
    Reaction.objects.create(post=p4, user=shourav)

    Comment.objects.create(
        post=p1,
        author=jamil,
        content="Anki flashcards দিয়ে reaction reagent মনে রাখা অনেক সহজ হয়! Visualising electron-pushing arrows with MolView website also helps a lot.",
    )
    Comment.objects.create(
        post=p2,
        author=supty,
        content="I am in! Especially for graph traversal algorithms and shortest paths problem solving.",
    )
    Comment.objects.create(
        post=p2,
        author=shourav,
        content="Count me in too! Weekend evenings suit best.",
    )
    Comment.objects.create(
        post=p4,
        author=shourav,
        content="For quick assemblies and cloud collaboration, Fusion 360 is great. For heavy FEA simulation, SolidWorks is standard.",
    )

    # Study Events
    StudyEvent.objects.all().delete()
    e1 = StudyEvent.objects.create(
        creator=jamil,
        title="Weekly LeetCode & Competitive Programming Bootcamp",
        description="Live collaborative problem solving on Dynamic Programming, Graph Theory, and Tree algorithms with code optimization analysis.",
        subject="Computer Science & Engineering",
        event_date=today + timedelta(days=2),
        start_time=time(17, 0),
        end_time=time(19, 30),
        location="CSE Seminar Hall / Discord Voice Room",
    )
    e2 = StudyEvent.objects.create(
        creator=bithy,
        title="Biochemistry & Organic Reaction Synthesis Review",
        description="High-yield synthesis problem solving, NMR spectra interpretation, and group discussion.",
        subject="Biochemistry",
        event_date=today + timedelta(days=4),
        start_time=time(15, 0),
        end_time=time(17, 0),
        location="Science Faculty Library - Room 304",
    )
    e3 = StudyEvent.objects.create(
        creator=rayhan,
        title="Robotics & Arduino Microcontroller Hands-on Workshop",
        description="Building sensor telemetry pipelines and PID motor control algorithms.",
        subject="Mechatronics Engineering",
        event_date=today + timedelta(days=6),
        start_time=time(14, 0),
        end_time=time(17, 0),
        location="Engineering Innovation Lab",
    )

    EventRSVP.objects.create(event=e1, user=jamil, status="going")
    EventRSVP.objects.create(event=e1, user=bithy, status="going")
    EventRSVP.objects.create(event=e1, user=supty, status="going")
    EventRSVP.objects.create(event=e1, user=shourav, status="going")
    EventRSVP.objects.create(event=e2, user=bithy, status="going")
    EventRSVP.objects.create(event=e2, user=jamil, status="going")
    EventRSVP.objects.create(event=e3, user=rayhan, status="going")
    EventRSVP.objects.create(event=e3, user=shourav, status="going")

    # Study Projects & Materials
    StudyMaterial.objects.all().delete()
    StudyProject.objects.all().delete()

    # Project 1: Jamil - Algorithms & Data Structures
    p1 = StudyProject.objects.create(
        user=jamil,
        title="Algorithms & Advanced Data Structures",
        subject="Computer Science & Engineering",
        description="Core syllabus covering Graph Theory, Dynamic Programming, Tree traversals, and amortized complexity analysis.",
        color="#2563eb",
    )
    StudyMaterial.objects.create(
        project=p1,
        user=jamil,
        title="Graph Algorithms & Shortest Paths Notes.pdf",
        material_type="document",
        file_size_bytes=2450000,
        content_text="Comprehensive notes on Dijkstra, Bellman-Ford, Floyd-Warshall, and Johnson algorithm with adjacency matrix representations.",
        ai_analysis={
            "title": "Shortest Path & Graph Traversal Algorithms",
            "summary": "Covers single-source and all-pairs shortest path algorithms in directed and undirected graphs. Compares time complexities across adjacency lists and matrices.",
            "difficulty": "Advanced",
            "key_topics": ["Dijkstra Algorithm", "Bellman-Ford Algorithm", "Floyd-Warshall", "Negative Weight Cycles", "Priority Queues"],
            "key_formulas_or_definitions": [
                "Dijkstra Time Complexity: O((V + E) log V)",
                "Bellman-Ford Relaxation: dist[v] = min(dist[v], dist[u] + weight(u, v))",
            ],
        },
        analyzed_at=timezone.now(),
    )
    StudyMaterial.objects.create(
        project=p1,
        user=jamil,
        title="VisuAlgo - Interactive Algorithm Visualizations",
        material_type="link",
        link_url="https://visualgo.net/en",
        content_text="Visualizing data structures and algorithms through animation.",
        ai_analysis={
            "title": "Interactive Computer Science Data Structures",
            "summary": "Visual animations showing step-by-step executions of graph algorithms, heap operations, and dynamic programming state transitions.",
            "difficulty": "Intermediate",
            "key_topics": ["Binary Heaps", "Graph Traversal", "Topological Sort", "Algorithm Visualization"],
            "key_formulas_or_definitions": ["Visual execution step inspection"],
        },
        analyzed_at=timezone.now(),
    )
    StudyMaterial.objects.create(
        project=p1,
        user=jamil,
        title="Dynamic Programming Memoization vs Tabulation Cheat Sheet",
        material_type="note",
        content_text="Top-down memoization uses recursion + cache. Bottom-up tabulation uses iteration + table. Space optimization techniques for 0/1 Knapsack.",
        ai_analysis={
            "title": "Dynamic Programming Paradigm Comparison",
            "summary": "Detailed breakdown between recursive top-down memoization and iterative bottom-up tabulation. Focuses on state transitions and memory reduction.",
            "difficulty": "Intermediate",
            "key_topics": ["Memoization", "Tabulation", "State Transition Equation", "0/1 Knapsack", "Space Optimization"],
            "key_formulas_or_definitions": ["dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w - wt[i]])"],
        },
        analyzed_at=timezone.now(),
    )

    # Project 2: Baitun - Molecular Biochemistry & Enzyme Kinetics
    p2 = StudyProject.objects.create(
        user=bithy,
        title="Molecular Biochemistry & Metabolic Pathways",
        subject="Biochemistry & Molecular Biology",
        description="Lecture series on cellular respiration, glycolysis, Krebs cycle, and enzyme inhibition kinetics.",
        color="#10b981",
    )
    StudyMaterial.objects.create(
        project=p2,
        user=bithy,
        title="Enzyme Kinetics & Lineweaver-Burk Derivations.pdf",
        material_type="document",
        file_size_bytes=3840000,
        content_text="Michaelis-Menten kinetics, competitive vs non-competitive inhibition, allosteric regulation.",
        ai_analysis={
            "title": "Enzyme Kinetics and Mathematical Modeling",
            "summary": "Detailed derivation of Michaelis-Menten equation and Lineweaver-Burk double reciprocal plots. Explains Vmax and Km parameters under various inhibitors.",
            "difficulty": "Advanced",
            "key_topics": ["Michaelis-Menten Equation", "Lineweaver-Burk Plot", "Competitive Inhibition", "Allosteric Modulators", "Catalytic Efficiency (kcat/Km)"],
            "key_formulas_or_definitions": [
                "v0 = (Vmax * [S]) / (Km + [S])",
                "Lineweaver-Burk: 1/v0 = (Km/Vmax)(1/[S]) + 1/Vmax",
            ],
        },
        analyzed_at=timezone.now(),
    )
    StudyMaterial.objects.create(
        project=p2,
        user=bithy,
        title="NCBI Biochemical Pathway Database",
        material_type="link",
        link_url="https://www.ncbi.nlm.nih.gov/",
        content_text="GenBank, BLAST, and structural biological database reference for metabolic pathway mapping.",
    )

    print("✨ Successfully generated 7 Bangladeshi scholar demo accounts with complete data across all features!")
    print("--------------------------------------------------------------------------------------------------")
    print("Demo Account Logins (Password for all: 'Password123!'):")
    print("1. Baitun Nahar Bithy      -> baitun.bithy@example.com      (Rank #1 Leaderboard / Biochemistry)")
    print("2. Jamil Hossain           -> jamil.hossain@example.com     (Rank #2 Leaderboard / CSE & DSA)")
    print("3. Saptarshi Biswas Supty  -> saptarshi.supty@example.com   (Rank #3 Leaderboard / Mathematics)")
    print("4. Shourav Shah            -> shourav.shah@example.com      (Software Engineering & Cloud)")
    print("5. Rayhan Chowdhury        -> rayhan.chowdhury@example.com  (Mechanical & Robotics)")
    print("6. Rafiq Al Mustafa        -> rafiq.mustafa@example.com     (EEE & Circuit Signals)")
    print("7. Shofiqur Rahaman        -> shofiqur.rahaman@example.com  (Economics & Quantitative Finance)")
    print("--------------------------------------------------------------------------------------------------")


if __name__ == "__main__":
    seed()
