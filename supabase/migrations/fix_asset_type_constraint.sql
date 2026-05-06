-- Add 'crypto' to the asset_type check constraint
alter table assets
  drop constraint if exists assets_asset_type_check;

alter table assets
  add constraint assets_asset_type_check
    check (asset_type in ('crypto', 'gold', 'stock', 'savings', 'real_estate', 'cash', 'other'));
