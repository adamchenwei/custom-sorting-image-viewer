# ⚠️ MANDATORY: Archive User Input After Every Push

## When to Run This
**IMMEDIATELY after every `git push` command.**

## Steps (Copy-Paste These Commands)

### 0. Bump version number:
**Before archiving, increment the version number to reflect the new changes.**

**Refer to your tooling context file** (`_agent-guide/app-user-input/context/app-definations-tool-context-selected.md`) for:
- Version file location (e.g., `package.json` for Node.js, `Cargo.toml` for Rust, `pyproject.toml` for Python)
- Command to read current version
- Any auto-bump mechanisms

Increment the version following [Semantic Versioning](https://semver.org/):
- **Patch** (0.1.0 → 0.1.1): Bug fixes, minor changes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

**AI Agent Instruction:**
Use the `edit` tool to update the version field in the appropriate version file. For example:
- If current version is `0.1.0` and you made bug fixes, change to `0.1.1`
- If you added new features, change to `0.2.0`
- If you made breaking changes, change to `1.0.0`

After updating, commit the version bump:
```bash
git add [version-file]
git commit -m "chore(version): bump version to X.Y.Z"
git push
```

### 1. Get timestamp:
```bash
date +"%Y%m%d-%H%M%S-EST"
```
Copy the output (e.g., `20251021-071702-EST`)

### 2. Create history folder (replace TIMESTAMP with output from step 1):
```bash
mkdir -p "_agent-guide/app-user-input/history/TIMESTAMP"
```

**Example:**
```bash
mkdir -p "_agent-guide/app-user-input/history/20251021-071702-EST"
```

### 3. Copy current input to history:
```bash
cp "_agent-guide/app-user-input/current-user-input.md" "_agent-guide/app-user-input/history/TIMESTAMP/old-user-input.md"
```

**Example:**
```bash
cp "_agent-guide/app-user-input/current-user-input.md" "_agent-guide/app-user-input/history/20251021-071702-EST/old-user-input.md"
```

### 4. Clear current input:
Edit `_agent-guide/app-user-input/current-user-input.md` and make it completely empty (delete all content).

### 5. Commit the archive:
```bash
git add _agent-guide/app-user-input/
git commit -m "docs: archive user input to history/TIMESTAMP"
git push
```

**Example:**
```bash
git add _agent-guide/app-user-input/
git commit -m "docs: archive user input to history/20251021-071702-EST"
git push
```

## ⚠️ This is NOT Optional

Every push must be followed by archiving. No exceptions.

**Why this matters:**
- Preserves history of all user requests
- Allows tracking what was completed when
- Prevents loss of context between iterations
- Required for proper iteration loop workflow

## Quick Checklist

- [ ] Just pushed code?
- [ ] Bump version in version file (per tooling context)
- [ ] Commit and push version bump
- [ ] Get timestamp
- [ ] Create history folder
- [ ] Copy current-user-input.md to history
- [ ] Clear current-user-input.md
- [ ] Commit and push archive

**If you skip this, you'll lose track of completed work.**
