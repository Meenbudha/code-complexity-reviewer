🚀 Code Complexity Reviewer: GitHub Setup Guide

Follow these steps to initialize your project with Git and push it to GitHub.

Step 1: Initialize Git

Open your terminal in the root folder of your project (the parent folder containing frontend, backend, and ml-service).

git init


Step 2: Create a .gitignore File

It is critical to exclude heavy dependency folders and sensitive files. Create a file named .gitignore in your root directory and paste the following:

# Node modules
node_modules/
frontend/node_modules/
backend/node_modules/

# Python virtual environments
venv/
env/

# Environment variables
.env

# IDE files
.vscode/
.idea/
.DS_Store


Step 3: Local Commit

Stage your files and create your first local snapshot.

git add .
git commit -m "Initial commit: Code Complexity Reviewer structure"


Step 4: Create a Repository on GitHub

Log in to GitHub.com.

Click the + icon in the top right → New repository.

Name: code-complexity-reviewer

Visibility: Public or Private.

Initialize: Do not check "Initialize with README" or "Add .gitignore" (you have already done this locally).

Click Create repository.

Step 5: Connect and Push

Copy the commands from the GitHub instruction page (under the "push an existing repository" section) or use the template below:

# Set the default branch to main
git branch -M main

# Link your local folder to GitHub (Replace YOUR-USERNAME with your actual username)
git remote add origin [https://github.com/YOUR-USERNAME/code-complexity-reviewer.git](https://github.com/YOUR-USERNAME/code-complexity-reviewer.git)

# Push your code
git push -u origin main


📋 Summary Table of Commands

Action                  Command

Initialize              git init

Stage Files             git add .

Commit                  git commit -m "First commit"

Rename Branch           git branch -M main

Remote Link             git remote add origin https://github.com/USER/REPO.git

Push                    git push -u origin main

Step 6: Verify

Refresh your GitHub repository page. You should now see your frontend, backend, and ml-service directories properly organized.