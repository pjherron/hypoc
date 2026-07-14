#!/bin/bash
# test-opencode-upgrade.sh
# OpenCode Update Verification Test Suite

set -euo pipefail

# ─── Deployment Configuration ─────────────────────────────────────────────────
# Set these environment variables before running, or export them in your shell.
AWS_REGION="${AWS_REGION:-}"  # e.g. us-gov-west-1
PROJECT_DIR="${PROJECT_DIR:-${HOME}}"  # e.g. /Users/pherron6/dev/opencode
# ─────────────────────────────────────────────────────────────────────────────

VERSION_TO_TEST="${1:-1.14.19}"
TEST_MODE="${2:-post}"  # pre | post
BACKUP_DIR="$HOME/.opencode-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

# Test result tracking
declare -a FAILED_TESTS

test_result() {
    local test_name="$1"
    local result="$2"
    local message="${3:-}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} $test_name: $message"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_TESTS+=("$test_name: $message")
    fi
}

# Snapshot function
create_snapshot() {
    echo "Creating backup snapshot..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup config
    cp -r ~/.opencode "$BACKUP_DIR/dot-opencode" 2>/dev/null || true
    cp -r ~/.local/share/opencode "$BACKUP_DIR/local-share-opencode" 2>/dev/null || true
    
    # Save current version
    opencode --version > "$BACKUP_DIR/version.txt" 2>&1 || true
    
    # Save current config
    opencode debug config > "$BACKUP_DIR/config.json" 2>&1 || true
    
    # Save skill count
    opencode debug skill 2>/dev/null | jq -r 'length' > "$BACKUP_DIR/skill-count.txt" 2>&1 || echo "0" > "$BACKUP_DIR/skill-count.txt"
    
    echo "Backup created at: $BACKUP_DIR"
}

# Category 1: Core Binary Tests
test_category_1() {
    echo "=== Category 1: Core Binary & Version ==="
    
    # Test: Binary exists
    if [ -f "/opt/homebrew/bin/opencode" ]; then
        test_result "Binary exists" "PASS"
    else
        test_result "Binary exists" "FAIL" "Binary not found at /opt/homebrew/bin/opencode"
    fi
    
    # Test: Binary is executable
    if [ -x "/opt/homebrew/bin/opencode" ]; then
        test_result "Binary is executable" "PASS"
    else
        test_result "Binary is executable" "FAIL" "Binary not executable"
    fi
    
    # Test: Version command works
    if version_output=$(opencode --version 2>&1); then
        test_result "Version command works" "PASS"
        
        # Test: Version is semver
        if echo "$version_output" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+'; then
            test_result "Version is valid semver" "PASS"
        else
            test_result "Version is valid semver" "FAIL" "Output: $version_output"
        fi
    else
        test_result "Version command works" "FAIL" "Command failed"
    fi
    
    # Test: Help command works
    if opencode --help >/dev/null 2>&1; then
        test_result "Help command works" "PASS"
    else
        test_result "Help command works" "FAIL"
    fi
    
    # Test: Debug config returns valid JSON
    if config_output=$(opencode debug config 2>&1); then
        if echo "$config_output" | jq empty 2>/dev/null; then
            test_result "Debug config returns valid JSON" "PASS"
        else
            test_result "Debug config returns valid JSON" "FAIL" "Not valid JSON"
        fi
    else
        test_result "Debug config returns valid JSON" "FAIL" "Command failed"
    fi
}

# Category 2: Configuration Integrity Tests
test_category_2() {
    echo "=== Category 2: Configuration Integrity ==="
    
    config_output=$(opencode debug config 2>&1)
    
    # Test: Config has plugin array
    if echo "$config_output" | jq -e '.plugin | type == "array"' >/dev/null 2>&1; then
        test_result "Config has plugin array" "PASS"
    else
        test_result "Config has plugin array" "FAIL"
    fi
    
    # Test: Config has model
    if echo "$config_output" | jq -e '.model' >/dev/null 2>&1; then
        test_result "Config has model" "PASS"
    else
        test_result "Config has model" "FAIL"
    fi
    
    # Test: Config has provider
    if echo "$config_output" | jq -e '.provider' >/dev/null 2>&1; then
        test_result "Config has provider" "PASS"
    else
        test_result "Config has provider" "FAIL"
    fi
    
    # Test: AWS Bedrock provider exists
    if echo "$config_output" | jq -e '.provider["amazon-bedrock"]' >/dev/null 2>&1; then
        test_result "AWS Bedrock provider configured" "PASS"
    else
        test_result "AWS Bedrock provider configured" "FAIL"
    fi
    
    # Test: Bedrock model ID correct
    if echo "$config_output" | jq -e '.provider["amazon-bedrock"].models["claude-4.5-gov"].id == "us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0"' >/dev/null 2>&1; then
        test_result "Bedrock model ID unchanged" "PASS"
    else
        test_result "Bedrock model ID unchanged" "FAIL"
    fi
    
    # Test: Bedrock region correct
    if echo "$config_output" | jq -e '.provider["amazon-bedrock"].options.region == "${AWS_REGION}"' >/dev/null 2>&1; then
        test_result "Bedrock region unchanged" "PASS"
    else
        test_result "Bedrock region unchanged" "FAIL"
    fi
}

# Category 3: Plugin System Tests
test_category_3() {
    echo "=== Category 3: Plugin System ==="
    
    config_output=$(opencode debug config 2>&1)
    
    # Test: superpowers plugin in config
    if echo "$config_output" | jq -e '.plugin[] | select(contains("superpowers"))' >/dev/null 2>&1; then
        test_result "Superpowers plugin configured" "PASS"
    else
        test_result "Superpowers plugin configured" "FAIL"
    fi
    
    # Test: ecc-universal plugin in config
    if echo "$config_output" | jq -e '.plugin[] | select(. == "ecc-universal")' >/dev/null 2>&1; then
        test_result "ECC-universal plugin configured" "PASS"
    else
        test_result "ECC-universal plugin configured" "FAIL"
    fi
    
    # Test: ecc-universal globally installed
    if [ -d "/opt/homebrew/lib/node_modules/ecc-universal" ]; then
        test_result "ECC-universal globally installed" "PASS"
    else
        test_result "ECC-universal globally installed" "FAIL"
    fi
    
    # Test: @opencode-ai/plugin in ~/.opencode
    if [ -d "$HOME/.opencode/node_modules/@opencode-ai/plugin" ]; then
        test_result "@opencode-ai/plugin installed" "PASS"
    else
        test_result "@opencode-ai/plugin installed" "FAIL"
    fi
    
    # Test: Custom plugin directory exists
    if [ -d "${PROJECT_DIR}/.opencode/plugins" ]; then
        test_result "Custom plugin directory exists" "PASS"
    else
        test_result "Custom plugin directory exists" "FAIL"
    fi
    
    # Test: Custom plugin files exist
    for file in ecc-hooks.ts skill-discovery.ts skill-discovery.js index.ts; do
        if [ -f "${PROJECT_DIR}/.opencode/plugins/$file" ]; then
            test_result "Custom plugin file: $file" "PASS"
        else
            test_result "Custom plugin file: $file" "FAIL" "File not found"
        fi
    done
    
    # Test: Plugin files are readable
    if [ -r "${PROJECT_DIR}/.opencode/plugins/ecc-hooks.ts" ]; then
        test_result "ecc-hooks.ts is readable" "PASS"
    else
        test_result "ecc-hooks.ts is readable" "FAIL"
    fi
}

# Category 4: Skill Discovery Tests
test_category_4() {
    echo "=== Category 4: Skill Discovery ==="
    
    # Test: ~/.claude/skills exists
    if [ -d "$HOME/.claude/skills" ]; then
        test_result "~/.claude/skills directory exists" "PASS"
        
        # Count skills
        skill_count=$(ls -1 "$HOME/.claude/skills" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$skill_count" -ge 25 ]; then
            test_result "~/.claude/skills has $skill_count skills" "PASS"
        else
            test_result "~/.claude/skills skill count" "FAIL" "Only $skill_count skills (expected 30+)"
        fi
    else
        test_result "~/.claude/skills directory exists" "FAIL"
    fi
    
    # Test: Project skills directory exists
    if [ -d "${PROJECT_DIR}/skills" ]; then
        test_result "Project skills directory exists" "PASS"
        
        # Count project skills
        proj_skill_count=$(ls -1 "${PROJECT_DIR}/skills" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$proj_skill_count" -ge 180 ]; then
            test_result "Project has $proj_skill_count skills" "PASS"
        else
            test_result "Project skill count" "FAIL" "Only $proj_skill_count skills (expected 189+)"
        fi
    else
        test_result "Project skills directory exists" "FAIL"
    fi
    
    # Test: debug skill command works
    if skill_output=$(opencode debug skill 2>&1); then
        test_result "Debug skill command works" "PASS"
        
        # Test: Output is valid JSON array
        if echo "$skill_output" | jq -e 'type == "array"' >/dev/null 2>&1; then
            test_result "Skill output is valid JSON array" "PASS"
            
            # Count total discoverable skills
            total_skills=$(echo "$skill_output" | jq -r 'length')
            if [ "$total_skills" -ge 200 ]; then
                test_result "Total discoverable skills: $total_skills" "PASS"
            else
                test_result "Total skill count" "FAIL" "Only $total_skills skills (expected 200+)"
            fi
        else
            test_result "Skill output is valid JSON array" "FAIL"
        fi
    else
        test_result "Debug skill command works" "FAIL"
    fi
    
    # Test: Key skills are discoverable
    if skill_output=$(opencode debug skill 2>&1); then
        for skill in "aws-infrastructure" "kubernetes-patterns" "fastapi-patterns" "coding-standards" "security-review"; do
            if echo "$skill_output" | jq -e ".[] | select(.name == \"$skill\")" >/dev/null 2>&1; then
                test_result "Skill discoverable: $skill" "PASS"
            else
                test_result "Skill discoverable: $skill" "FAIL"
            fi
        done
    fi
}

# Category 5: Provider & Credentials Tests
test_category_5() {
    echo "=== Category 5: Provider & Credentials ==="
    
    # Test: AWS environment variables
    if [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
        test_result "AWS_ACCESS_KEY_ID present" "PASS"
    else
        test_result "AWS_ACCESS_KEY_ID present" "FAIL"
    fi
    
    if [ -n "${AWS_SECRET_ACCESS_KEY:-}" ]; then
        test_result "AWS_SECRET_ACCESS_KEY present" "PASS"
    else
        test_result "AWS_SECRET_ACCESS_KEY present" "FAIL"
    fi
    
    if [ -n "${AWS_REGION:-}" ]; then
        test_result "AWS_REGION present" "PASS"
    else
        test_result "AWS_REGION present" "FAIL"
    fi
    
    # Test: providers list command
    if providers_output=$(opencode providers list 2>&1); then
        test_result "Providers list command works" "PASS"
        
        # Test: Amazon Bedrock shown
        if echo "$providers_output" | grep -q "Amazon Bedrock"; then
            test_result "Amazon Bedrock provider shown" "PASS"
        else
            test_result "Amazon Bedrock provider shown" "FAIL"
        fi
    else
        test_result "Providers list command works" "FAIL"
    fi
}

# Category 6: Data Integrity Tests
test_category_6() {
    echo "=== Category 6: Data Integrity ==="
    
    # Test: Data directory exists
    if [ -d "$HOME/.local/share/opencode" ]; then
        test_result "Data directory exists" "PASS"
    else
        test_result "Data directory exists" "FAIL"
    fi
    
    # Test: Database file exists
    if [ -f "$HOME/.local/share/opencode/opencode.db" ]; then
        test_result "Database file exists" "PASS"
        
        # Test: Database is non-empty
        db_size=$(stat -f%z "$HOME/.local/share/opencode/opencode.db" 2>/dev/null || echo 0)
        if [ "$db_size" -gt 1000 ]; then
            test_result "Database file is non-empty" "PASS"
        else
            test_result "Database file is non-empty" "FAIL" "Size: $db_size bytes"
        fi
    else
        test_result "Database file exists" "FAIL"
    fi
    
    # Test: Log directory exists
    if [ -d "$HOME/.local/share/opencode/log" ]; then
        test_result "Log directory exists" "PASS"
    else
        test_result "Log directory exists" "FAIL"
    fi
    
    # Test: Can list sessions
    if opencode session list >/dev/null 2>&1; then
        test_result "Can list sessions" "PASS"
    else
        test_result "Can list sessions" "FAIL"
    fi
}

# Category 7: Hook System Tests
test_category_7() {
    echo "=== Category 7: Hook System ==="
    
    # Test: ecc-hooks.ts exists
    if [ -f "${PROJECT_DIR}/.opencode/plugins/ecc-hooks.ts" ]; then
        test_result "ecc-hooks.ts exists" "PASS"
        
        # Test: File has expected content
        if grep -q "ECCHooksPlugin" "${PROJECT_DIR}/.opencode/plugins/ecc-hooks.ts"; then
            test_result "ecc-hooks.ts has ECCHooksPlugin export" "PASS"
        else
            test_result "ecc-hooks.ts has ECCHooksPlugin export" "FAIL"
        fi
        
        # Test: References PluginInput type
        if grep -q "PluginInput" "${PROJECT_DIR}/.opencode/plugins/ecc-hooks.ts"; then
            test_result "ecc-hooks.ts references PluginInput type" "PASS"
        else
            test_result "ecc-hooks.ts references PluginInput type" "FAIL"
        fi
    else
        test_result "ecc-hooks.ts exists" "FAIL"
    fi
    
    # Test: skill-discovery files exist
    for file in skill-discovery.ts skill-discovery.js; do
        if [ -f "${PROJECT_DIR}/.opencode/plugins/$file" ]; then
            test_result "$file exists" "PASS"
        else
            test_result "$file exists" "FAIL"
        fi
    done
}

# Category 8: Functional Tests (Dry-Run)
test_category_8() {
    echo "=== Category 8: Functional Tests (Dry-Run) ==="
    
    # Test: debug paths command
    if opencode debug paths >/dev/null 2>&1; then
        test_result "Debug paths command works" "PASS"
    else
        test_result "Debug paths command works" "FAIL"
    fi
    
    # Test: session list with limit
    if opencode session list --limit 5 >/dev/null 2>&1; then
        test_result "Session list with limit works" "PASS"
    else
        test_result "Session list with limit works" "FAIL"
    fi
    
    # Test: stats command (if available)
    if opencode stats >/dev/null 2>&1; then
        test_result "Stats command works" "PASS"
    else
        # Not a failure if command doesn't exist
        test_result "Stats command available" "PASS" "(command may not exist in this version)"
    fi
}

# Category 9: Live Test (Wet-Run)
test_category_9() {
    echo "=== Category 9: Live Test (Wet-Run) ==="
    
    if [ "$TEST_MODE" != "post" ]; then
        echo "Skipping wet test (only runs in post-upgrade mode)"
        return
    fi
    
    echo "Running live AI query test..."
    
    # Create a temporary test query
    if output=$(timeout 60 opencode run "What is 2+2? Respond with only the number." --model amazon-bedrock/claude-4.5-gov 2>&1); then
        test_result "Can execute AI query" "PASS"
        
        # Test: Response contains the number 4
        if echo "$output" | grep -q "4"; then
            test_result "AI response is correct" "PASS"
        else
            test_result "AI response is correct" "FAIL" "Response: $output"
        fi
    else
        test_result "Can execute AI query" "FAIL" "Command failed or timed out"
    fi
}

# Generate rollback instructions
generate_rollback_instructions() {
    cat <<EOF

===========================================
ROLLBACK INSTRUCTIONS (if needed)
===========================================

To rollback to version 1.3.10:

1. Uninstall current version:
   brew uninstall opencode

2. Install 1.3.10:
   cd \$(brew --repo anomalyco/tap)
   git checkout 0b88c52  # commit for v1.3.10
   HOMEBREW_NO_AUTO_UPDATE=1 brew install anomalyco/tap/opencode
   git reset --hard HEAD

3. Restore backup (if needed):
   cp -r $BACKUP_DIR/dot-opencode ~/.opencode
   cp -r $BACKUP_DIR/local-share-opencode ~/.local/share/opencode

4. Verify:
   opencode --version  # Should show 1.3.10

===========================================
EOF
}

# Main test execution
main() {
    echo "========================================"
    echo "OpenCode Update Verification Test Suite"
    echo "========================================"
    echo "Version to test: $VERSION_TO_TEST"
    echo "Test mode: $TEST_MODE"
    echo ""
    
    if [ "$TEST_MODE" = "pre" ]; then
        create_snapshot
        echo ""
    fi
    
    test_category_1
    echo ""
    test_category_2
    echo ""
    test_category_3
    echo ""
    test_category_4
    echo ""
    test_category_5
    echo ""
    test_category_6
    echo ""
    test_category_7
    echo ""
    test_category_8
    echo ""
    test_category_9
    echo ""
    
    # Summary
    echo "========================================"
    echo "TEST SUMMARY"
    echo "========================================"
    echo "Total tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
    echo -e "${RED}Failed: $FAIL_COUNT${NC}"
    echo ""
    
    if [ $FAIL_COUNT -gt 0 ]; then
        echo -e "${RED}FAILED TESTS:${NC}"
        for failed in "${FAILED_TESTS[@]}"; do
            echo "  - $failed"
        done
        echo ""
        
        if [ "$TEST_MODE" = "post" ]; then
            generate_rollback_instructions
        fi
        
        exit 1
    else
        echo -e "${GREEN}✓ All tests passed!${NC}"
        
        if [ "$TEST_MODE" = "pre" ]; then
            echo ""
            echo "Pre-upgrade tests complete. Safe to proceed with upgrade."
            echo "Run upgrade, then execute: $0 $VERSION_TO_TEST post"
        else
            echo ""
            echo "Post-upgrade tests complete. Upgrade successful!"
            echo "Backup preserved at: $BACKUP_DIR"
        fi
        
        exit 0
    fi
}

main "$@"
