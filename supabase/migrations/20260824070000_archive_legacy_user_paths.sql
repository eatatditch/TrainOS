-- Preserve legacy assignment history without treating links to retired paths
-- as current work. The authoritative seed now includes the same reconciliation
-- so future rollouts remain idempotent.

begin;

update public."UserTrainingPath" utp
set "isActive" = false
where utp."isActive" = true
  and exists (
    select 1
    from public."TrainingPath" path
    where path.id = utp."trainingPathId"
      and path."isActive" = false
  );

commit;
