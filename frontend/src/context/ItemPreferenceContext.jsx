import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { itemActionService } from '../services/itemActionService';

const ItemPreferenceContext = createContext(null);

const normalizeId = (id) => String(id);

export const ItemPreferenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [states, setStates] = useState({ material: {}, assignment: {} });
  const [pending, setPending] = useState({});
  const [revision, setRevision] = useState(0);

  const applyState = useCallback((type, itemId, patch) => {
    const id = normalizeId(itemId);
    setStates((prev) => {
      const prevType = prev[type] || {};
      const prevItem = prevType[id] || { isSaved: false, isFavorite: false };
      return {
        ...prev,
        [type]: {
          ...prevType,
          [id]: {
            ...prevItem,
            ...patch,
          },
        },
      };
    });
    setRevision((r) => r + 1);
  }, []);

  const mergeRows = useCallback((type, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    setStates((prev) => {
      const nextType = { ...(prev[type] || {}) };
      rows.forEach((row) => {
        const id = normalizeId(row.itemId ?? row.id);
        const prevItem = nextType[id] || { isSaved: false, isFavorite: false };
        nextType[id] = {
          ...prevItem,
          isSaved: Boolean(row.isSaved),
          isFavorite: Boolean(row.isFavorite),
        };
      });
      return { ...prev, [type]: nextType };
    });
    setRevision((r) => r + 1);
  }, []);

  const seedMaterialStates = useCallback((items = []) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setStates((prev) => {
      const nextType = { ...(prev.material || {}) };
      items.forEach((item) => {
        const id = normalizeId(item.id ?? item.itemId);
        const prevItem = nextType[id] || { isSaved: false, isFavorite: false };
        nextType[id] = {
          ...prevItem,
          isSaved: typeof item.isSaved === 'boolean' ? item.isSaved : prevItem.isSaved,
          isFavorite: typeof item.isFavorite === 'boolean' ? item.isFavorite : prevItem.isFavorite,
        };
      });
      return { ...prev, material: nextType };
    });
    setRevision((r) => r + 1);
  }, []);

  const ensureStates = useCallback(async (type, itemIds = []) => {
    if (!user || !Array.isArray(itemIds) || itemIds.length === 0) return;
    const ids = itemIds.map(normalizeId);
    const rows = await itemActionService.getStates({ type, itemIds: ids });
    mergeRows(type, rows);
  }, [mergeRows, user]);

  const getState = useCallback((type, itemId) => {
    const id = normalizeId(itemId);
    const state = states[type]?.[id];
    return {
      isSaved: Boolean(state?.isSaved),
      isFavorite: Boolean(state?.isFavorite),
    };
  }, [states]);

  const isPending = useCallback((type, itemId, action) => {
    const key = `${type}:${normalizeId(itemId)}:${action}`;
    return Boolean(pending[key]);
  }, [pending]);

  const setPendingFlag = useCallback((type, itemId, action, value) => {
    const key = `${type}:${normalizeId(itemId)}:${action}`;
    setPending((prev) => {
      if (!value) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: true };
    });
  }, []);

  const toggleSaved = useCallback(async (type, itemId) => {
    const id = normalizeId(itemId);
    const prev = getState(type, id);
    const nextValue = !prev.isSaved;

    applyState(type, id, { isSaved: nextValue });
    setPendingFlag(type, id, 'save', true);
    try {
      if (nextValue) {
        await itemActionService.save({ type, itemId: id });
      } else {
        await itemActionService.unsave({ type, itemId: id });
      }
    } catch (error) {
      applyState(type, id, { isSaved: prev.isSaved, isFavorite: prev.isFavorite });
      throw error;
    } finally {
      setPendingFlag(type, id, 'save', false);
    }
  }, [applyState, getState, setPendingFlag]);

  const toggleFavorite = useCallback(async (type, itemId) => {
    const id = normalizeId(itemId);
    const prev = getState(type, id);
    const nextValue = !prev.isFavorite;

    applyState(type, id, { isFavorite: nextValue });
    setPendingFlag(type, id, 'favorite', true);
    try {
      if (nextValue) {
        await itemActionService.favorite({ type, itemId: id });
      } else {
        await itemActionService.unfavorite({ type, itemId: id });
      }
    } catch (error) {
      applyState(type, id, { isSaved: prev.isSaved, isFavorite: prev.isFavorite });
      throw error;
    } finally {
      setPendingFlag(type, id, 'favorite', false);
    }
  }, [applyState, getState, setPendingFlag]);

  useEffect(() => {
    let mounted = true;

    const preload = async () => {
      if (!user) {
        setStates({ material: {}, assignment: {} });
        setPending({});
        setRevision((r) => r + 1);
        return;
      }

      try {
        const [savedMaterials, favoriteMaterials, savedAssignments, favoriteAssignments] = await Promise.all([
          itemActionService.getSaved('material'),
          itemActionService.getFavorites('material'),
          itemActionService.getSaved('assignment'),
          itemActionService.getFavorites('assignment'),
        ]);

        if (!mounted) return;

        const materialById = {};
        [...savedMaterials, ...favoriteMaterials].forEach((row) => {
          const id = normalizeId(row.itemId);
          materialById[id] = {
            isSaved: Boolean(materialById[id]?.isSaved || row.isSaved),
            isFavorite: Boolean(materialById[id]?.isFavorite || row.isFavorite),
          };
        });

        const assignmentById = {};
        [...savedAssignments, ...favoriteAssignments].forEach((row) => {
          const id = normalizeId(row.itemId);
          assignmentById[id] = {
            isSaved: Boolean(assignmentById[id]?.isSaved || row.isSaved),
            isFavorite: Boolean(assignmentById[id]?.isFavorite || row.isFavorite),
          };
        });

        setStates({ material: materialById, assignment: assignmentById });
        setRevision((r) => r + 1);
      } catch (error) {
        console.error('Failed to preload item preference states:', error);
      }
    };

    preload();

    return () => {
      mounted = false;
    };
  }, [user]);

  const value = useMemo(() => ({
    getState,
    ensureStates,
    toggleSaved,
    toggleFavorite,
    isPending,
    seedMaterialStates,
    revision,
  }), [ensureStates, getState, isPending, revision, seedMaterialStates, toggleFavorite, toggleSaved]);

  return (
    <ItemPreferenceContext.Provider value={value}>
      {children}
    </ItemPreferenceContext.Provider>
  );
};

export const useItemPreference = () => {
  const context = useContext(ItemPreferenceContext);
  if (!context) {
    throw new Error('useItemPreference must be used within ItemPreferenceProvider');
  }
  return context;
};
