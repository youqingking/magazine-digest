param(
  [Parameter(Mandatory = $true)]
  [string]$ScenarioId
)
node scripts/content/select-runtime-scenario.mjs --scenario-id $ScenarioId
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
