"""Structured portfolio data served by the Python backend."""

from __future__ import annotations

from typing import Any

from api._lib.mailer import get_active_transport, get_receiver_email


def get_portfolio_payload() -> dict[str, Any]:
    """Return canonical portfolio content for K. Somanath Reddy."""
    return {
        "profile": {
            "brand": "Somanath.",
            "fullName": "K. Somanath Reddy",
            "role": "B.Tech CSE (AI & ML) Student · Python Developer",
            "university": "Jain University",
            "year": "2nd Year",
            "location": "Bengaluru, India",
            "email": get_receiver_email(),
            "githubUrl": "https://github.com/konasomanathreddy",
            "headline": "Building practical Python backends, clean databases, and thoughtful web solutions.",
            "summary": (
                "I'm a second-year Computer Science student at Jain University specializing in "
                "Artificial Intelligence and Machine Learning. I enjoy Python programming, "
                "relational databases, and collaborating with teams to turn ideas into reliable software."
            ),
            "availability": "Open to internships, learning opportunities, and collaborative builds",
        },
        "highlights": [
            {"label": "Python", "value": "Intermediate", "detail": "APIs, Scripting & Logic"},
            {"label": "SQL", "value": "Relational", "detail": "Schemas & Query Design"},
            {"label": "AI & ML", "value": "B.Tech CSE", "detail": "Academic Specialization"},
            {"label": "GitHub", "value": "Active", "detail": "Open Source & Coursework"},
        ],
        "about": [
            {
                "index": "01",
                "title": "Who I Am",
                "description": (
                    "I'm K. Somanath Reddy, a B.Tech student pursuing Computer Science & Engineering "
                    "with a specialization in Artificial Intelligence and Machine Learning at Jain University. "
                    "I build my engineering foundation through structured coursework, hands-on coding, and "
                    "real full-stack experiments."
                ),
            },
            {
                "index": "02",
                "title": "My Goal",
                "description": (
                    "My goal is to launch a career in the software and IT industry, contribute to "
                    "production-grade collaborative projects, sharpen my backend Python and database skills, "
                    "and learn from experienced engineering teams."
                ),
            },
        ],
        "skills": [
            {
                "name": "Python",
                "level": "Intermediate",
                "category": "Backend & Scripting",
                "description": "Serverless HTTP handlers, input validation, SQLite persistence, and structured modules.",
            },
            {
                "name": "SQL",
                "level": "Foundational",
                "category": "Databases",
                "description": "Relational schema modeling, indexed queries, and clean data integrity.",
            },
            {
                "name": "GitHub & Git",
                "level": "Practical",
                "category": "Version Control",
                "description": "Repository organization, branch workflows, and collaborative code sharing.",
            },
            {
                "name": "AI & Machine Learning",
                "level": "Academic Focus",
                "category": "Specialization",
                "description": "Core algorithms, data structures, and foundational ML concepts in B.Tech CSE.",
            },
            {
                "name": "Teamwork",
                "level": "Collaborative",
                "category": "Engineering Practice",
                "description": "Clear technical communication, peer problem solving, and shared project delivery.",
            },
        ],
        "projects": [
            {
                "id": "project-01",
                "index": "Project 01",
                "category": "Python & Web Development",
                "title": "Python Student Website Project 1",
                "summary": (
                    "A student website project built as part of my practical learning in Python and "
                    "web development, structured for clean routing and maintainable templates."
                ),
                "details": (
                    "Developed to bridge core Python programming concepts with real web interfaces. "
                    "Focuses on clean project structure, server-side handling, and versioned repository "
                    "workflows stored on GitHub."
                ),
                "stack": ["Python", "HTML & CSS", "GitHub"],
                "repoUrl": "https://github.com/konasomanathreddy/Two_Python_Student_Website_Projects",
                "imageKey": "project_one",
            },
            {
                "id": "project-02",
                "index": "Project 02",
                "category": "Python Application Architecture",
                "title": "Python Student Website Project 2",
                "summary": (
                    "A second student website project focused on Python-based web application workflows, "
                    "clean file organization, and practical backend integration."
                ),
                "details": (
                    "Extends my first web build by organizing multi-file application modules, improving "
                    "request handling patterns, and preparing projects for cloud deployment."
                ),
                "stack": ["Python", "SQL", "Web Architecture"],
                "repoUrl": "https://github.com/konasomanathreddy/Two_Python_Student_Website_Projects",
                "imageKey": "project_two",
            },
        ],
        "education": {
            "degree": "Bachelor of Technology (B.Tech)",
            "status": "Currently Pursuing · 2nd Year",
            "field": "Computer Science & Engineering — Artificial Intelligence & Machine Learning",
            "institution": "Jain University",
            "highlights": [
                "Coursework in Python Programming, Data Structures, and Database Management Systems",
                "Specialization track in Artificial Intelligence & Machine Learning",
                "Building practical web and backend projects alongside academic study",
            ],
        },
        "backendInfo": {
            "runtime": "Python Serverless Backend",
            "emailTransport": get_active_transport(),
        },
    }
