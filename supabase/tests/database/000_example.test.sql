-- T-SETUP-6: proves pgTAP runs against the local database.
begin;
create extension if not exists pgtap with schema extensions;

select plan(1);

select ok(true, 'T-SETUP-6: pgTAP runs');

select * from finish();
rollback;
