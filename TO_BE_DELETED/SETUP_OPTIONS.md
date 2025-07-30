# Setup Options - Debug Player Framework

**Last Certified: 2025-07-30**

Choose the setup method that best fits your needs:

## Option 1: Docker Setup (Recommended for Clean Environment)
**Best for:** Quick start, minimal system impact, Windows/Mac users

**Time:** 5 minutes  
**System Impact:** Minimal (only Docker required)

```bash
git clone git@github.com:thamam/DebugDrivePlayback.git
cd DebugDrivePlayback
docker-compose up --build
```

**Pros:** No dependencies on your system, identical across platforms, easy cleanup  
**Cons:** Slightly slower performance, requires Docker

📖 **[Complete Docker Setup Guide](DOCKER_SETUP.md)**  
📖 **[Simple Docker Setup (For Build Issues)](DOCKER_SETUP_SIMPLE.md)**

---

## Option 2: Manual Setup (Best Performance)
**Best for:** Long-term development, maximum performance, large datasets

**Time:** 20-30 minutes  
**System Impact:** High (installs Node.js, Python, PostgreSQL)

**Prerequisites:** Node.js 22, Python 3.11, PostgreSQL 15+

📖 **[Complete Manual Setup Guide](LOCAL_SETUP.md)**

---

## Option 3: Streamlined Manual Setup
**Best for:** Experienced developers, custom environments

**Time:** 10-15 minutes  
**System Impact:** Medium (minimal required dependencies)

📖 **[Streamlined Setup Guide](MANUAL_SETUP_STREAMLINED.md)**

---

## Quick Comparison

| Feature | Docker | Manual | Streamlined |
|---------|--------|--------|-------------|
| Setup Time | 5 min | 30 min | 15 min |
| Performance | Good | Excellent | Excellent |
| System Impact | Minimal | High | Medium |
| Dependencies | Docker only | Many | Essential only |
| Cleanup | Easy | Manual | Manual |

## Platform-Specific Notes

### Windows Users
- **Recommended:** Docker setup (avoids Windows-specific issues)
- **Manual:** Use WSL2 for best experience

### Mac Users  
- **Recommended:** Docker or Manual (both work well)
- **Note:** Use Homebrew for dependencies

### Linux Users
- **Recommended:** Streamlined Manual (best performance)
- **Docker:** Also excellent option
