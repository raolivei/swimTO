import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { favoritesApi } from "@/lib/api";
import {
  getFavoritesFromLocalStorage,
  addFavoriteToLocalStorage,
  removeFavoriteFromLocalStorage,
  syncLocalFavoritesToBackend,
} from "@/lib/utils";

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());

  // Load localStorage favorites for guest users
  useEffect(() => {
    if (!isAuthenticated) {
      setLocalFavorites(getFavoritesFromLocalStorage());
    }
  }, [isAuthenticated]);

  // Fetch favorites from backend for authenticated users
  const { data: backendFavorites, isLoading: isLoadingBackend } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const favorites = await favoritesApi.getAll();
      return new Set(favorites.map((f) => f.facility_id));
    },
    enabled: isAuthenticated,
    staleTime: 30000, // 30 seconds
  });

  // Sync local favorites to backend when user logs in
  useEffect(() => {
    if (isAuthenticated && localFavorites.size > 0) {
      syncLocalFavoritesToBackend({
        add: async (facilityId: string) => {
          await favoritesApi.add(facilityId);
          return;
        },
      }).then(() => {
        setLocalFavorites(new Set());
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
      });
    }
  }, [isAuthenticated, queryClient]);

  // Add favorite mutation
  const addMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      if (isAuthenticated) {
        await favoritesApi.add(facilityId);
      } else {
        addFavoriteToLocalStorage(facilityId);
        setLocalFavorites((prev) => new Set([...prev, facilityId]));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Remove favorite mutation
  const removeMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      if (isAuthenticated) {
        await favoritesApi.remove(facilityId);
      } else {
        removeFavoriteFromLocalStorage(facilityId);
        setLocalFavorites((prev) => {
          const next = new Set(prev);
          next.delete(facilityId);
          return next;
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // Get current favorites set
  const favorites = isAuthenticated
    ? backendFavorites || new Set<string>()
    : localFavorites;

  // Check if facility is favorited
  const isFavorite = (facilityId: string) => favorites.has(facilityId);

  // Toggle favorite
  const toggleFavorite = async (facilityId: string) => {
    if (isFavorite(facilityId)) {
      await removeMutation.mutateAsync(facilityId);
    } else {
      await addMutation.mutateAsync(facilityId);
    }
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isLoading: isLoadingBackend,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
