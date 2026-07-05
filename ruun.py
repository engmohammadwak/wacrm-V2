import subprocess
from colorama import Fore, Style, init

init(autoreset=True)

download_commands = [
    "git pull origin main",
    "php artisan migrate",
    "php artisan optimize:clear",
    "php artisan view:clear",
    "php artisan cache:clear",
    "php artisan serve"
]

upload_commands = [
    "git status",
    "git add .",
    'git commit -m "Update project"',
    "git push origin main",
]

reset_upload_commands = [
    "rmdir /s /q .git",
    "git init",
    "git add .",
    'git commit -m "Initial upload"',
    "git branch -M main",
    "git remote add origin https://github.com/engmohammadwak/wacrm.git",
    "git push -u origin main --force",
]

print(Fore.CYAN + "=" * 45)
print(Fore.YELLOW + "🚀 Git Manager")
print(Fore.CYAN + "=" * 45)
print(Fore.GREEN + "1️⃣  Upload to GitHub")
print(Fore.BLUE + "2️⃣  Download from GitHub")
print(Fore.RED + "3️⃣  Reset Git & Force Upload")
print(Fore.CYAN + "=" * 45)

choice = input(Fore.MAGENTA + "👉 Choose (1/2/3): " + Style.RESET_ALL).strip()

if choice == "1":
    commands = upload_commands
    title = "📤 Uploading..."
elif choice == "2":
    commands = download_commands
    title = "📥 Downloading..."
elif choice == "3":
    confirm = input(
        Fore.RED
        + "⚠️ This will DELETE .git and FORCE PUSH.\nContinue? (y/n): "
    ).lower()

    if confirm != "y":
        print(Fore.YELLOW + "❌ Cancelled.")
        exit()

    commands = reset_upload_commands
    title = "💣 Resetting & Force Uploading..."
else:
    print(Fore.RED + "❌ Invalid choice.")
    exit()

print(Fore.CYAN + f"\n{title}\n")

for cmd in commands:
    print(Fore.YELLOW + f"▶ {cmd}")

    result = subprocess.run(cmd, shell=True)

    if result.returncode == 0:
        print(Fore.GREEN + "✅ Success\n")
    else:
        print(Fore.RED + f"❌ Failed: {cmd}")
        break
else:
    print(Fore.GREEN + "🎉 All operations completed successfully!")
