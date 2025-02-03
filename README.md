# UniHub - Redefining Learning Experience 

UniHub is an AI-powered academic productivity platform that leverages Retrieval-Augmented Generation (RAG) to transform how students learn. By providing contextual answers based on uploaded course materials, UniHub enables more effective and efficient studying through intelligent content retrieval and personalized learning assistance.


![UniHub Banner}
<p align="center">
  🔗 <a href="https://unihub-web" style="font-size: 18px"><b>www.unihub.com</b></a>
</p>

## 🚀 Features
- **AI-powered learning assistant** that provides contextual answers.
- **Smart retrieval of academic resources** to enhance learning.
- **Collaboration tools** to improve student engagement.

## 📌 Installation & Setup

1. **Clone the repository:**
```

2. **Install dependencies** (if applicable):
   - If using Node.js:
   ```
   npm install
   ```


3. **Run the project**:
   - If using Node.js:
   ```
   npm run dev
   ```


## 🔄 Git Workflow

### **Push changes to origin**
```
git add .
git commit -m "Your commit message"
git push origin main
```

### **Sync updates from origin to client repository**
Run the script to force-sync from origin to the client repository:
```
chmod +x sync.sh
./sync.sh
```

## 🛠️ Automation Script (`sync.sh`)
This script ensures that **origin is the source of truth** and force-pushes updates to the client repository.

```
#!/bin/bash

echo "Fetching latest changes..."
git fetch origin
git fetch client

echo "Resetting client branch to match origin (force overwrite)..."
git reset --hard origin/main  # Ensures local branch exactly matches origin

echo "Force pushing to client repo..."
git push --force client main  # Overwrites the client repo

echo "Sync completed! The client repository is now up-to-date with origin."
```

## 👥 Team Members

## 📜 License
This project is licensed under the **GPL-3.0 License**.

---
