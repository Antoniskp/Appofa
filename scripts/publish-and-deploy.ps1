param(
  [switch]$CreatePr,
  [switch]$MergePr,
  [string]$BaseBranch = "main",
  [string]$Remote = "origin",
  [string]$Title = "",
  [string]$Body = ""
)

$ErrorActionPreference = "Stop"

function Require-Command($Name) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "$Name is required but was not found on PATH."
  }
}

function Run-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function Run-Gh {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & gh @Args
  if ($LASTEXITCODE -ne 0) {
    throw "gh $($Args -join ' ') failed with exit code $LASTEXITCODE."
  }
}

Require-Command git

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) {
  throw "This command must be run inside a git repository."
}
Set-Location $repoRoot

$status = (& git status --porcelain)
if ($status) {
  throw "Working tree has uncommitted changes. Commit or stash them before publishing."
}

$currentBranch = (& git branch --show-current).Trim()
if (-not $currentBranch) {
  throw "Could not determine the current git branch."
}

Run-Git fetch $Remote $BaseBranch

if ($CreatePr -or $MergePr) {
  Require-Command gh
  Run-Gh auth status

  if ($currentBranch -eq $BaseBranch) {
    throw "Refusing to create a PR from $BaseBranch to itself. Create or checkout a feature branch first."
  }

  Run-Git push -u $Remote $currentBranch

  $existingPr = (& gh pr list --head $currentBranch --base $BaseBranch --state open --json number --jq ".[0].number").Trim()
  if ($existingPr) {
    $prNumber = $existingPr
    Write-Host "Using existing PR #$prNumber."
  } else {
    $safeTitle = if ($Title) { $Title } else { "Publish $currentBranch" }
    $safeBody = if ($Body) { $Body } else { "Publishes local changes from $currentBranch to $BaseBranch so the deploy workflow can run after merge." }
    Run-Gh pr create --base $BaseBranch --head $currentBranch --title $safeTitle --body $safeBody
    $prNumber = (& gh pr view --json number --jq ".number").Trim()
    Write-Host "Created PR #$prNumber."
  }

  if ($MergePr) {
    Run-Gh pr merge $prNumber --squash --delete-branch
    Write-Host "Merged PR #$prNumber into $BaseBranch. GitHub Actions Deploy will run from the remote $BaseBranch update."
  } else {
    Write-Host "PR #$prNumber is open. Merge it to trigger the Deploy workflow."
  }

  exit 0
}

if ($currentBranch -ne $BaseBranch) {
  throw "Current branch is '$currentBranch'. Use -CreatePr to publish it through a PR, or checkout '$BaseBranch' before direct publishing."
}

Run-Git push $Remote $BaseBranch
Write-Host "Pushed $BaseBranch to $Remote. GitHub Actions Deploy will run if the push added a new commit to remote $BaseBranch."
