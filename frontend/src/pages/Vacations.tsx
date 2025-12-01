import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacationsApi } from '../services/api';
import { Vacation } from '../types';
import { useAuth } from '../context/AuthContext';
import VacationCard from '../components/VacationCard';
import { initializeSocket } from '../services/socket';
import './Vacations.css';

const Vacations: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    following: false,
    notStarted: false,
    active: false,
  });
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  const fetchVacations = async () => {
    setLoading(true);
    try {
      const response = await vacationsApi.getAll({ page, ...filters });

      // Merge server data with local storage changes
      const localFollows = JSON.parse(localStorage.getItem('vacationFollows') || '{}');
      const mergedVacations = response.vacations.map((vacation: Vacation) => {
        const localUpdate = localFollows[vacation.vacationId.toString()];
        if (localUpdate) {
          return {
            ...vacation,
            isFollowing: localUpdate.isFollowing,
            followersCount: (vacation.followersCount || 0) + localUpdate.delta,
          };
        }
        return vacation;
      });

      setVacations(mergedVacations);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching vacations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacations();
  }, [page, filters]);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const socket = initializeSocket();

    socket.on('vacation-update', (data: { vacationId: number; action: string }) => {
      console.log('Vacation update received:', data);

      // Check if this is our own action that we just made
      const actionKey = `${data.action}-${data.vacationId}`;
      if (pendingActions.has(actionKey)) {
        // This is our own action, ignore the socket update
        console.log('Ignoring own action:', actionKey);
        return;
      }

      // This is someone else's action, refetch to show updates
      fetchVacations();
    });

    return () => {
      socket.off('vacation-update');
    };
  }, [page, filters, pendingActions]);

  const handleFollow = async (id: string) => {
    try {
      // Mark this action as pending to ignore the socket update
      const actionKey = `follow-${id}`;
      setPendingActions((prev) => new Set(prev).add(actionKey));

      // Update UI immediately from local storage
      const localFollows = JSON.parse(localStorage.getItem('vacationFollows') || '{}');
      localFollows[id] = { isFollowing: true, delta: 1 };
      localStorage.setItem('vacationFollows', JSON.stringify(localFollows));

      // Update state immediately
      setVacations((prev) =>
        prev.map((v) =>
          v.vacationId === id
            ? { ...v, isFollowing: true, followersCount: (v.followersCount || 0) + 1 }
            : v
        )
      );

      // Send request to server in background
      await vacationsApi.follow(id);

      // Clear local storage for this vacation after successful server update
      const updatedFollows = JSON.parse(localStorage.getItem('vacationFollows') || '{}');
      delete updatedFollows[id];
      localStorage.setItem('vacationFollows', JSON.stringify(updatedFollows));

      // Remove from pending actions after a delay to ensure socket event is processed
      setTimeout(() => {
        setPendingActions((prev) => {
          const next = new Set(prev);
          next.delete(actionKey);
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error('Error following vacation:', error);
      // Revert UI on error
      setVacations((prev) =>
        prev.map((v) =>
          v.vacationId === id
            ? { ...v, isFollowing: false, followersCount: (v.followersCount || 1) - 1 }
            : v
        )
      );
      // Remove from local storage
      const localFollows = JSON.parse(localStorage.getItem('vacationFollows') || '{}');
      delete localFollows[id];
      localStorage.setItem('vacationFollows', JSON.stringify(localFollows));
      // Remove from pending actions
      const actionKey = `follow-${id}`;
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  const handleUnfollow = async (id: string) => {
    try {
      // Mark this action as pending to ignore the socket update
      const actionKey = `unfollow-${id}`;
      setPendingActions((prev) => new Set(prev).add(actionKey));

      // Update UI immediately from local storage
      const localFollows = JSON.parse(localStorage.getItem('vacationFollows') || '{}');
      localFollows[id] = { isFollowing: false, delta: -1 };
      localStorage.setItem('vacationFollows', JSON.stringify(localFollows));

      // Update state immediately
      setVacations((prev) =>
        prev.map((v) =>
          v.vacationId === id
            ? { ...v, isFollowing: false, followersCount: (v.followersCount || 1) - 1 }
            : v
        )
      );

      // Send request to server in background
      await vacationsApi.unfollow(id);

      // Clear local storage for this vacation after successful server update
      const updatedFollows = JSON.parse(localStorage.getItem('vacationFollows') || '{}');
      delete updatedFollows[id];
      localStorage.setItem('vacationFollows', JSON.stringify(updatedFollows));

      // Remove from pending actions after a delay to ensure socket event is processed
      setTimeout(() => {
        setPendingActions((prev) => {
          const next = new Set(prev);
          next.delete(actionKey);
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error('Error unfollowing vacation:', error);
      // Revert UI on error
      setVacations((prev) =>
        prev.map((v) =>
          v.vacationId === id
            ? { ...v, isFollowing: true, followersCount: (v.followersCount || 0) + 1 }
            : v
        )
      );
      // Remove from local storage
      const localFollows = JSON.parse(localStorage.getItem('vacationFollows') || '{}');
      delete localFollows[id];
      localStorage.setItem('vacationFollows', JSON.stringify(localFollows));
      // Remove from pending actions
      const actionKey = `unfollow-${id}`;
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vacation?')) {
      return;
    }

    try {
      await vacationsApi.delete(id);
      fetchVacations();
    } catch (error) {
      console.error('Error deleting vacation:', error);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/vacations/edit/${id}`);
  };

  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilters((prev) => {
      // Reset other filters when selecting a new one
      const newFilters = {
        following: false,
        notStarted: false,
        active: false,
      };
      newFilters[filterName] = !prev[filterName];
      return newFilters;
    });
    setPage(1);
  };

  return (
    <div className="vacations-page">
      <div className="vacations-header">
        <h1>Vacations</h1>
        {isAdmin && (
          <button className="btn-add" onClick={() => navigate('/vacations/add')}>
            + Add Vacation
          </button>
        )}
        {isAdmin && (
          <button className="btn-reports" onClick={() => navigate('/reports')}>
            📊 Reports
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="filters">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.following}
              onChange={() => handleFilterChange('following')}
            />
            My Vacations
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.notStarted}
              onChange={() => handleFilterChange('notStarted')}
            />
            Not Started Yet
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.active}
              onChange={() => handleFilterChange('active')}
            />
            Active Now
          </label>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading vacations...</div>
      ) : (
        <>
          <div className="vacations-grid">
            {vacations.map((vacation) => (
              <VacationCard
                key={vacation.vacationId}
                vacation={vacation}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
            ))}
          </div>

          {vacations.length === 0 && (
            <div className="no-vacations">No vacations found</div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Vacations;
