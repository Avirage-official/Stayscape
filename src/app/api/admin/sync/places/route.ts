const options: PlaceSyncOptions = {
  region_id: body.region_id,
  latitude: body.latitude as number,
  longitude: body.longitude as number,
  radius_meters: body.radius_meters,
  categories: body.categories,
  limit: body.limit,
  skip_enrichment: body.skip_enrichment,
};