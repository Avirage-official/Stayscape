  // Trigger initial data load once (using null-check pattern for eslint refs rule)
  if (dataLoadedRef.current == null) {
    dataLoadedRef.current = true;
    refetchCategories();
    refetchInsights();
    refetchPlaces('top-places', 'Top Places', { limit: PLACES_PAGE_SIZE, offset: 0, regionId: region?.id });
    if (region?.id) refetchEvents(region.id);
  }

  // Re-load places whenever the region becomes available (region loads async after initial render)
  const regionLoadedRef = useRef<string | null>(null);
  if (region?.id && regionLoadedRef.current !== region.id) {
    regionLoadedRef.current = region.id;
    refetchPlaces('top-places', 'Top Places', { limit: PLACES_PAGE_SIZE, offset: 0, regionId: region.id });
  }
