-- Cover source-module foreign-key lookups independently of quiz ordering.

begin;

create index if not exists "QuizQuestion_sourceModuleId_idx"
  on public."QuizQuestion" ("sourceModuleId")
  where "sourceModuleId" is not null;

commit;
