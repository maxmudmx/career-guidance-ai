"""Skill-based o'quv kurslari katalogi.

Har bir ko'nikma uchun: tavsiya etilgan kurslar (platforma + URL),
qiyinlik darajasi va taxminiy o'rganish vaqti (haftalarda).
"""

# Qiyinlik darajalari: "asoslari" | "o'rta" | "yuqori"
COURSES = {
    "Python": {
        "difficulty": "asoslari",
        "weeks": 6,
        "courses": [
            {"title": "Python for Everybody", "platform": "Coursera", "url": "https://www.coursera.org/specializations/python", "free": True, "lang": "EN"},
            {"title": "Python uchun to'liq kurs", "platform": "YouTube (Sammi Academy)", "url": "https://www.youtube.com/results?search_query=python+kursi+uzbek", "free": True, "lang": "UZ"},
            {"title": "Learn Python — Full Course", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/news/learn-python-free-python-courses-for-beginners/", "free": True, "lang": "EN"},
        ],
    },
    "JavaScript": {
        "difficulty": "asoslari",
        "weeks": 6,
        "courses": [
            {"title": "The Modern JavaScript Tutorial", "platform": "javascript.info", "url": "https://javascript.info/", "free": True, "lang": "EN"},
            {"title": "JavaScript Algorithms and Data Structures", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "free": True, "lang": "EN"},
            {"title": "JavaScript darslari", "platform": "YouTube (Najot Ta'lim)", "url": "https://www.youtube.com/results?search_query=javascript+uzbek+tilida", "free": True, "lang": "UZ"},
        ],
    },
    "TypeScript": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "TypeScript Handbook", "platform": "Official Docs", "url": "https://www.typescriptlang.org/docs/handbook/intro.html", "free": True, "lang": "EN"},
            {"title": "TypeScript Course for Beginners", "platform": "YouTube (Academind)", "url": "https://www.youtube.com/watch?v=BwuLxPH8IDs", "free": True, "lang": "EN"},
        ],
    },
    "Solidity": {
        "difficulty": "yuqori",
        "weeks": 6,
        "courses": [
            {"title": "CryptoZombies", "platform": "CryptoZombies", "url": "https://cryptozombies.io/", "free": True, "lang": "EN"},
            {"title": "Solidity, Blockchain, Smart Contract Course", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/news/learn-solidity-blockchain-and-smart-contracts-in-a-32-hour-course/", "free": True, "lang": "EN"},
        ],
    },
    "HTML/CSS": {
        "difficulty": "asoslari",
        "weeks": 4,
        "courses": [
            {"title": "Responsive Web Design", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "free": True, "lang": "EN"},
            {"title": "Web Design for Beginners", "platform": "The Odin Project", "url": "https://www.theodinproject.com/paths/foundations/courses/foundations", "free": True, "lang": "EN"},
        ],
    },
    "React": {
        "difficulty": "o'rta",
        "weeks": 5,
        "courses": [
            {"title": "React Official Tutorial", "platform": "react.dev", "url": "https://react.dev/learn", "free": True, "lang": "EN"},
            {"title": "Full Stack Open — React", "platform": "University of Helsinki", "url": "https://fullstackopen.com/en/", "free": True, "lang": "EN"},
            {"title": "React Course for Beginners", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/news/free-react-course-2022/", "free": True, "lang": "EN"},
        ],
    },
    "React Native": {
        "difficulty": "o'rta",
        "weeks": 5,
        "courses": [
            {"title": "React Native Docs Tutorial", "platform": "Official", "url": "https://reactnative.dev/docs/tutorial", "free": True, "lang": "EN"},
            {"title": "React Native Crash Course", "platform": "YouTube (Programming with Mosh)", "url": "https://www.youtube.com/watch?v=0-S5a0eXPoc", "free": True, "lang": "EN"},
        ],
    },
    "Node.js": {
        "difficulty": "o'rta",
        "weeks": 4,
        "courses": [
            {"title": "Node.js Tutorial", "platform": "Official Docs", "url": "https://nodejs.org/en/learn", "free": True, "lang": "EN"},
            {"title": "Node.js & Express Course", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/news/node-js-tutorial/", "free": True, "lang": "EN"},
        ],
    },
    "SQL": {
        "difficulty": "asoslari",
        "weeks": 3,
        "courses": [
            {"title": "SQLBolt — Interactive SQL Tutorial", "platform": "SQLBolt", "url": "https://sqlbolt.com/", "free": True, "lang": "EN"},
            {"title": "Mode SQL Tutorial", "platform": "Mode Analytics", "url": "https://mode.com/sql-tutorial/", "free": True, "lang": "EN"},
            {"title": "SQL for Beginners", "platform": "Khan Academy", "url": "https://www.khanacademy.org/computing/computer-programming/sql", "free": True, "lang": "EN"},
        ],
    },
    "Matematika": {
        "difficulty": "asoslari",
        "weeks": 8,
        "courses": [
            {"title": "Mathematics for Machine Learning", "platform": "Coursera (Imperial)", "url": "https://www.coursera.org/specializations/mathematics-machine-learning", "free": True, "lang": "EN"},
            {"title": "Essence of Linear Algebra", "platform": "YouTube (3Blue1Brown)", "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab", "free": True, "lang": "EN"},
            {"title": "Khan Academy Calculus", "platform": "Khan Academy", "url": "https://www.khanacademy.org/math/calculus-1", "free": True, "lang": "EN"},
        ],
    },
    "Statistika": {
        "difficulty": "asoslari",
        "weeks": 5,
        "courses": [
            {"title": "Statistics and Probability", "platform": "Khan Academy", "url": "https://www.khanacademy.org/math/statistics-probability", "free": True, "lang": "EN"},
            {"title": "StatQuest with Josh Starmer", "platform": "YouTube", "url": "https://www.youtube.com/c/joshstarmer", "free": True, "lang": "EN"},
        ],
    },
    "Machine Learning": {
        "difficulty": "yuqori",
        "weeks": 10,
        "courses": [
            {"title": "Machine Learning Specialization", "platform": "Coursera (Andrew Ng)", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "free": True, "lang": "EN"},
            {"title": "Kaggle Learn — Intro to ML", "platform": "Kaggle", "url": "https://www.kaggle.com/learn/intro-to-machine-learning", "free": True, "lang": "EN"},
            {"title": "ML Crash Course", "platform": "Google", "url": "https://developers.google.com/machine-learning/crash-course", "free": True, "lang": "EN"},
        ],
    },
    "TensorFlow": {
        "difficulty": "yuqori",
        "weeks": 6,
        "courses": [
            {"title": "TensorFlow Developer Certificate", "platform": "Coursera (DeepLearning.AI)", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice", "free": True, "lang": "EN"},
            {"title": "TensorFlow Tutorials", "platform": "Official", "url": "https://www.tensorflow.org/tutorials", "free": True, "lang": "EN"},
        ],
    },
    "PyTorch": {
        "difficulty": "yuqori",
        "weeks": 6,
        "courses": [
            {"title": "PyTorch Official Tutorials", "platform": "PyTorch", "url": "https://pytorch.org/tutorials/", "free": True, "lang": "EN"},
            {"title": "Practical Deep Learning", "platform": "fast.ai", "url": "https://course.fast.ai/", "free": True, "lang": "EN"},
        ],
    },
    "NLP": {
        "difficulty": "yuqori",
        "weeks": 6,
        "courses": [
            {"title": "NLP Specialization", "platform": "Coursera (DeepLearning.AI)", "url": "https://www.coursera.org/specializations/natural-language-processing", "free": True, "lang": "EN"},
            {"title": "Hugging Face NLP Course", "platform": "Hugging Face", "url": "https://huggingface.co/learn/nlp-course/", "free": True, "lang": "EN"},
        ],
    },
    "Computer Vision": {
        "difficulty": "yuqori",
        "weeks": 6,
        "courses": [
            {"title": "CS231n: Deep Learning for CV", "platform": "Stanford", "url": "https://cs231n.stanford.edu/", "free": True, "lang": "EN"},
            {"title": "OpenCV Tutorials", "platform": "OpenCV.org", "url": "https://docs.opencv.org/4.x/d9/df8/tutorial_root.html", "free": True, "lang": "EN"},
        ],
    },
    "Data Visualization": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "Data Visualization", "platform": "Kaggle Learn", "url": "https://www.kaggle.com/learn/data-visualization", "free": True, "lang": "EN"},
            {"title": "Tableau Free Training", "platform": "Tableau", "url": "https://www.tableau.com/learn/training", "free": True, "lang": "EN"},
        ],
    },
    "Docker": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "Docker Get Started", "platform": "Official Docs", "url": "https://docs.docker.com/get-started/", "free": True, "lang": "EN"},
            {"title": "Docker Crash Course", "platform": "YouTube (TechWorld with Nana)", "url": "https://www.youtube.com/watch?v=3c-iBn73dDE", "free": True, "lang": "EN"},
        ],
    },
    "Kubernetes": {
        "difficulty": "yuqori",
        "weeks": 5,
        "courses": [
            {"title": "Kubernetes Basics", "platform": "kubernetes.io", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "free": True, "lang": "EN"},
            {"title": "Kubernetes for the Absolute Beginners", "platform": "KodeKloud", "url": "https://kodekloud.com/courses/kubernetes-for-the-absolute-beginners-hands-on/", "free": False, "lang": "EN"},
        ],
    },
    "Linux": {
        "difficulty": "asoslari",
        "weeks": 4,
        "courses": [
            {"title": "Linux Journey", "platform": "linuxjourney.com", "url": "https://linuxjourney.com/", "free": True, "lang": "EN"},
            {"title": "Linux Command Line Basics", "platform": "Coursera", "url": "https://www.coursera.org/learn/unix", "free": True, "lang": "EN"},
        ],
    },
    "AWS": {
        "difficulty": "o'rta",
        "weeks": 6,
        "courses": [
            {"title": "AWS Cloud Practitioner Essentials", "platform": "AWS Skill Builder", "url": "https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials", "free": True, "lang": "EN"},
            {"title": "AWS Free Tier Tutorials", "platform": "AWS", "url": "https://aws.amazon.com/getting-started/", "free": True, "lang": "EN"},
        ],
    },
    "Apache Spark": {
        "difficulty": "yuqori",
        "weeks": 5,
        "courses": [
            {"title": "Apache Spark Tutorial", "platform": "Databricks", "url": "https://www.databricks.com/learn/training/lp/apache-spark-tutorial", "free": True, "lang": "EN"},
            {"title": "PySpark Tutorial", "platform": "YouTube (freeCodeCamp)", "url": "https://www.youtube.com/watch?v=_C8kWso4ne4", "free": True, "lang": "EN"},
        ],
    },
    "Kafka": {
        "difficulty": "yuqori",
        "weeks": 4,
        "courses": [
            {"title": "Kafka Fundamentals", "platform": "Confluent Developer", "url": "https://developer.confluent.io/learn/", "free": True, "lang": "EN"},
            {"title": "Apache Kafka Crash Course", "platform": "YouTube (Stephane Maarek)", "url": "https://www.youtube.com/watch?v=R873BlNVUB4", "free": True, "lang": "EN"},
        ],
    },
    "CI/CD": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "GitHub Actions Tutorial", "platform": "GitHub Docs", "url": "https://docs.github.com/en/actions/learn-github-actions", "free": True, "lang": "EN"},
            {"title": "CI/CD Pipeline Tutorial", "platform": "YouTube (TechWorld with Nana)", "url": "https://www.youtube.com/watch?v=R8_veQiYBjI", "free": True, "lang": "EN"},
        ],
    },
    "Terraform": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "Terraform Tutorials", "platform": "HashiCorp Learn", "url": "https://developer.hashicorp.com/terraform/tutorials", "free": True, "lang": "EN"},
            {"title": "Terraform Crash Course", "platform": "YouTube (TechWorld with Nana)", "url": "https://www.youtube.com/watch?v=l5k1ai_GBDE", "free": True, "lang": "EN"},
        ],
    },
    "Firebase": {
        "difficulty": "o'rta",
        "weeks": 2,
        "courses": [
            {"title": "Firebase Fundamentals", "platform": "Google Codelabs", "url": "https://firebase.google.com/codelabs", "free": True, "lang": "EN"},
            {"title": "Firebase Tutorial for Beginners", "platform": "YouTube (Net Ninja)", "url": "https://www.youtube.com/playlist?list=PL4cUxeGkcC9jERUGvbudErNCeSZHWUVlb", "free": True, "lang": "EN"},
        ],
    },
    "Kriptografiya": {
        "difficulty": "yuqori",
        "weeks": 6,
        "courses": [
            {"title": "Cryptography I", "platform": "Coursera (Stanford)", "url": "https://www.coursera.org/learn/crypto", "free": True, "lang": "EN"},
            {"title": "Cryptography Basics", "platform": "Khan Academy", "url": "https://www.khanacademy.org/computing/computer-science/cryptography", "free": True, "lang": "EN"},
        ],
    },
    "Tarmoq xavfsizligi": {
        "difficulty": "o'rta",
        "weeks": 6,
        "courses": [
            {"title": "Network Security Fundamentals", "platform": "Cisco Networking Academy", "url": "https://www.netacad.com/courses/cybersecurity", "free": True, "lang": "EN"},
            {"title": "CompTIA Network+ Course", "platform": "YouTube (Professor Messer)", "url": "https://www.professormesser.com/network-plus/n10-008/n10-008-video/n10-008-training-course/", "free": True, "lang": "EN"},
        ],
    },
    "Penetration Testing": {
        "difficulty": "yuqori",
        "weeks": 8,
        "courses": [
            {"title": "TryHackMe — Beginner Path", "platform": "TryHackMe", "url": "https://tryhackme.com/path/outline/beginner", "free": True, "lang": "EN"},
            {"title": "Hack The Box Academy", "platform": "HTB", "url": "https://academy.hackthebox.com/", "free": True, "lang": "EN"},
        ],
    },
    "SIEM": {
        "difficulty": "yuqori",
        "weeks": 4,
        "courses": [
            {"title": "Splunk Fundamentals", "platform": "Splunk Education", "url": "https://www.splunk.com/en_us/training/free-courses/overview.html", "free": True, "lang": "EN"},
            {"title": "Introduction to SIEM", "platform": "YouTube (Cyberkraft)", "url": "https://www.youtube.com/results?search_query=siem+tutorial+for+beginners", "free": True, "lang": "EN"},
        ],
    },
    "Figma": {
        "difficulty": "asoslari",
        "weeks": 2,
        "courses": [
            {"title": "Figma for Beginners", "platform": "Figma Help Center", "url": "https://help.figma.com/hc/en-us/categories/360002051613", "free": True, "lang": "EN"},
            {"title": "Figma UI/UX Crash Course", "platform": "YouTube (DesignCourse)", "url": "https://www.youtube.com/watch?v=jwCmIBJ8Jtc", "free": True, "lang": "EN"},
        ],
    },
    "Dizayn": {
        "difficulty": "asoslari",
        "weeks": 4,
        "courses": [
            {"title": "Google UX Design Certificate", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-ux-design", "free": True, "lang": "EN"},
            {"title": "Design Principles", "platform": "Interaction Design Foundation", "url": "https://www.interaction-design.org/courses", "free": False, "lang": "EN"},
        ],
    },
    "UI Design": {
        "difficulty": "o'rta",
        "weeks": 4,
        "courses": [
            {"title": "Learn UI Design", "platform": "learnui.design", "url": "https://learnui.design/", "free": False, "lang": "EN"},
            {"title": "UI Design Best Practices", "platform": "YouTube (Flux Academy)", "url": "https://www.youtube.com/c/FluxWithRanSegall", "free": True, "lang": "EN"},
        ],
    },
    "Prototiplash": {
        "difficulty": "asoslari",
        "weeks": 2,
        "courses": [
            {"title": "Prototyping in Figma", "platform": "Figma Academy", "url": "https://www.figma.com/resources/learn-design/", "free": True, "lang": "EN"},
            {"title": "Rapid Prototyping", "platform": "Coursera", "url": "https://www.coursera.org/learn/rapid-prototyping", "free": True, "lang": "EN"},
        ],
    },
    "Foydalanuvchi tadqiqoti": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "UX Research Foundations", "platform": "Nielsen Norman Group", "url": "https://www.nngroup.com/courses/", "free": False, "lang": "EN"},
            {"title": "User Research Methods", "platform": "Coursera (UMich)", "url": "https://www.coursera.org/learn/user-research", "free": True, "lang": "EN"},
        ],
    },
    "Rang nazariyasi": {
        "difficulty": "asoslari",
        "weeks": 1,
        "courses": [
            {"title": "Color Theory for Designers", "platform": "Smashing Magazine", "url": "https://www.smashingmagazine.com/2010/01/color-theory-for-designers-part-1-the-meaning-of-color/", "free": True, "lang": "EN"},
        ],
    },
    "Tipografiya": {
        "difficulty": "asoslari",
        "weeks": 1,
        "courses": [
            {"title": "Typography Fundamentals", "platform": "Coursera (CalArts)", "url": "https://www.coursera.org/learn/typography", "free": True, "lang": "EN"},
        ],
    },
    "Kommunikatsiya": {
        "difficulty": "asoslari",
        "weeks": 2,
        "courses": [
            {"title": "Improving Communication Skills", "platform": "Coursera (Wharton)", "url": "https://www.coursera.org/learn/wharton-communication-skills", "free": True, "lang": "EN"},
        ],
    },
    "Boshqaruv": {
        "difficulty": "o'rta",
        "weeks": 4,
        "courses": [
            {"title": "Google Project Management Certificate", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-project-management", "free": True, "lang": "EN"},
        ],
    },
    "Agile": {
        "difficulty": "asoslari",
        "weeks": 2,
        "courses": [
            {"title": "Scrum Guide", "platform": "scrumguides.org", "url": "https://scrumguides.org/", "free": True, "lang": "EN"},
            {"title": "Agile with Atlassian Jira", "platform": "Coursera", "url": "https://www.coursera.org/learn/agile-atlassian-jira", "free": True, "lang": "EN"},
        ],
    },
    "Git": {
        "difficulty": "asoslari",
        "weeks": 2,
        "courses": [
            {"title": "Pro Git Book", "platform": "git-scm.com", "url": "https://git-scm.com/book/en/v2", "free": True, "lang": "EN"},
            {"title": "Git & GitHub Crash Course", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/news/git-and-github-for-beginners/", "free": True, "lang": "EN"},
        ],
    },
    "API Design": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "REST API Tutorial", "platform": "restfulapi.net", "url": "https://restfulapi.net/", "free": True, "lang": "EN"},
            {"title": "FastAPI Documentation", "platform": "FastAPI", "url": "https://fastapi.tiangolo.com/tutorial/", "free": True, "lang": "EN"},
        ],
    },
    "API Integration": {
        "difficulty": "o'rta",
        "weeks": 2,
        "courses": [
            {"title": "Postman Learning Center", "platform": "Postman", "url": "https://learning.postman.com/", "free": True, "lang": "EN"},
        ],
    },
    "System Design": {
        "difficulty": "yuqori",
        "weeks": 6,
        "courses": [
            {"title": "System Design Primer", "platform": "GitHub", "url": "https://github.com/donnemartin/system-design-primer", "free": True, "lang": "EN"},
            {"title": "System Design Interview", "platform": "YouTube (ByteByteGo)", "url": "https://www.youtube.com/c/ByteByteGo", "free": True, "lang": "EN"},
        ],
    },
    "Testing": {
        "difficulty": "asoslari",
        "weeks": 3,
        "courses": [
            {"title": "ISTQB Foundation Level", "platform": "ISTQB", "url": "https://www.istqb.org/certifications/certified-tester-foundation-level", "free": False, "lang": "EN"},
            {"title": "Software Testing Tutorial", "platform": "Guru99", "url": "https://www.guru99.com/software-testing.html", "free": True, "lang": "EN"},
        ],
    },
    "Selenium": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "Selenium WebDriver Documentation", "platform": "Selenium", "url": "https://www.selenium.dev/documentation/", "free": True, "lang": "EN"},
            {"title": "Selenium Python Tutorial", "platform": "YouTube (Tech with Tim)", "url": "https://www.youtube.com/results?search_query=selenium+python+tutorial", "free": True, "lang": "EN"},
        ],
    },
    "Jira": {
        "difficulty": "asoslari",
        "weeks": 1,
        "courses": [
            {"title": "Atlassian University — Jira", "platform": "Atlassian", "url": "https://university.atlassian.com/student/catalog", "free": True, "lang": "EN"},
        ],
    },
    "Risk Analysis": {
        "difficulty": "o'rta",
        "weeks": 2,
        "courses": [
            {"title": "Risk Management Foundations", "platform": "Coursera (PMI)", "url": "https://www.coursera.org/learn/project-risk-management", "free": True, "lang": "EN"},
        ],
    },
    "Budjetlashtirish": {
        "difficulty": "asoslari",
        "weeks": 2,
        "courses": [
            {"title": "Project Budget Management", "platform": "Coursera", "url": "https://www.coursera.org/learn/project-management-budget", "free": True, "lang": "EN"},
        ],
    },
    "Excel": {
        "difficulty": "asoslari",
        "weeks": 3,
        "courses": [
            {"title": "Excel Skills for Business", "platform": "Coursera (Macquarie)", "url": "https://www.coursera.org/specializations/excel", "free": True, "lang": "EN"},
            {"title": "ExcelJet Tutorials", "platform": "Exceljet", "url": "https://exceljet.net/", "free": True, "lang": "EN"},
        ],
    },
    "Vizualizatsiya": {
        "difficulty": "o'rta",
        "weeks": 3,
        "courses": [
            {"title": "Data Visualization with Tableau", "platform": "Coursera (UC Davis)", "url": "https://www.coursera.org/specializations/data-visualization", "free": True, "lang": "EN"},
        ],
    },
    "Web3": {
        "difficulty": "yuqori",
        "weeks": 5,
        "courses": [
            {"title": "Alchemy University — Web3 Bootcamp", "platform": "Alchemy", "url": "https://university.alchemy.com/", "free": True, "lang": "EN"},
            {"title": "Ethereum.org Developer Resources", "platform": "ethereum.org", "url": "https://ethereum.org/en/developers/", "free": True, "lang": "EN"},
        ],
    },
    "Smart Contracts": {
        "difficulty": "yuqori",
        "weeks": 5,
        "courses": [
            {"title": "Hardhat Tutorial", "platform": "Hardhat", "url": "https://hardhat.org/tutorial", "free": True, "lang": "EN"},
            {"title": "OpenZeppelin Learn", "platform": "OpenZeppelin", "url": "https://docs.openzeppelin.com/learn/", "free": True, "lang": "EN"},
        ],
    },
}


# Foundational ko'nikmalar — yuqorida o'rganilishi shart
_FOUNDATIONAL = {
    "Python", "JavaScript", "HTML/CSS", "SQL", "Git", "Linux",
    "Matematika", "Statistika", "Kommunikatsiya", "Agile", "Excel",
    "Figma", "Dizayn", "Testing",
}

_DIFFICULTY_ORDER = {"asoslari": 0, "o'rta": 1, "yuqori": 2}


def get_courses_for_skill(skill: str) -> dict:
    """Bitta ko'nikma uchun kurslar va metama'lumotni qaytaradi."""
    entry = COURSES.get(skill)
    if not entry:
        return {
            "skill": skill,
            "difficulty": "o'rta",
            "weeks": 4,
            "courses": [{
                "title": f"{skill} bo'yicha qidiruv",
                "platform": "YouTube",
                "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial",
                "free": True,
                "lang": "EN",
            }],
            "is_foundational": skill in _FOUNDATIONAL,
        }
    return {
        "skill": skill,
        "difficulty": entry["difficulty"],
        "weeks": entry["weeks"],
        "courses": entry["courses"],
        "is_foundational": skill in _FOUNDATIONAL,
    }


def build_learning_path(missing_skills: list[str], required_order: list[str] | None = None) -> dict:
    """Yetishmayotgan ko'nikmalardan tartiblangan o'quv yo'lini quradi.

    Tartib: foundational birinchi → qiyinligi kam → required_skills tartibi.
    """
    items = [get_courses_for_skill(s) for s in missing_skills]

    order_index = {s: i for i, s in enumerate(required_order or [])}

    def sort_key(item):
        return (
            0 if item["is_foundational"] else 1,
            _DIFFICULTY_ORDER.get(item["difficulty"], 1),
            order_index.get(item["skill"], 999),
        )

    items.sort(key=sort_key)

    # Priority belgisi (1 = eng birinchi)
    for i, item in enumerate(items):
        item["priority"] = i + 1

    total_weeks = sum(it["weeks"] for it in items)

    return {
        "total_skills": len(items),
        "total_weeks": total_weeks,
        "estimated_months": round(total_weeks / 4, 1),
        "items": items,
    }
