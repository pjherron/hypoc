# Syncing Hypoc-Face with Hypoc

Hypoc-Face uses Hypoc as a git submodule. This guide covers keeping them synchronized.

## Understanding the Relationship

- **Hypoc** (`./hypoc/`): Base OpenCode configuration (git submodule)
- **Hypoc-Face**: Enterprise platform that extends Hypoc

Changes to Hypoc affect Hypoc-Face, but not vice versa. Hypoc-Face cannot modify Hypoc directly.

## Updating Hypoc

### Pull Latest Hypoc Changes

```bash
cd ~/dev/code/opencode/hypoc-face
cd hypoc
git pull origin main
cd ..
git add hypoc
git commit -m "chore: update Hypoc submodule to latest"
```

### Update to Specific Hypoc Version

```bash
cd hypoc
git fetch
git checkout <commit-hash-or-tag>
cd ..
git add hypoc
git commit -m "chore: pin Hypoc to version <version>"
```

## Working on Hypoc Changes

If you need to contribute changes to Hypoc:

### 1. Work Directly in Hypoc Repo

```bash
cd ~/dev/code/opencode/hypoc
git checkout -b feature/my-change
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/my-change
```

### 2. Update Hypoc-Face's Submodule Reference

```bash
cd ~/dev/code/opencode/hypoc-face
cd hypoc
git pull origin feature/my-change
cd ..
git add hypoc
git commit -m "chore: update Hypoc to feature/my-change"
```

### 3. Merge Hypoc Changes Upstream

Once your Hypoc PR is merged:
```bash
cd ~/dev/code/opencode/hypoc-face/hypoc
git checkout main
git pull origin main
cd ..
git add hypoc
git commit -m "chore: update Hypoc submodule after merge"
```

## Conflict Resolution

### When Hypoc-Face and Hypoc Both Change

If both repos have uncommitted changes:

```bash
# Stash Hypoc-Face changes
git stash

# Update Hypoc
cd hypoc
git pull origin main
cd ..

# Apply Hypoc-Face changes
git stash pop

# If conflicts, resolve and commit
git add .
git commit -m "chore: sync with latest Hypoc"
```

## Best Practices

1. **Update Hypoc regularly** - Don't let Hypoc-Face fall behind
2. **Test after Hypoc updates** - Hypoc changes may affect Hypoc-Face components
3. **Pin Hypoc versions** - For production deployments, use specific commits
4. **Document breaking changes** - When Hypoc updates break Hypoc-Face, document in CHANGELOG
5. **Never modify Hypoc inside Hypoc-Face** - Always work in the Hypoc repo directly

## Troubleshooting

### Submodule Not Initialized

```bash
git submodule update --init --recursive
```

### Submodule Stuck on Old Commit

```bash
cd hypoc
git checkout main
git pull origin main
cd ..
git add hypoc
git commit -m "chore: update Hypoc submodule"
```

### Detached HEAD in Hypoc Submodule

This is normal for submodules. To work on Hypoc:
```bash
cd hypoc
git checkout main
# Make changes
```

## Automation

Consider setting up:
- Weekly Hypoc update checks
- Automated testing when Hypoc updates
- Notifications for breaking changes in Hypoc

## Related Documentation

- [Hypoc README](../hypoc/README.md)
- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
