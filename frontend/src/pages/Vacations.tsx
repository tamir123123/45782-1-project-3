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

  const fetchVacations = async () => {
    setLoading(true);
    try {
      const response = await vacationsApi.getAll({ page, ...filters });
      setVacations(response.vacations);
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
      // For follow/unfollow, ignore socket updates since we refetch in handleFollow/handleUnfollow
      // Only refetch for add/edit/delete actions
      if (data.action !== 'follow' && data.action !== 'unfollow') {
        fetchVacations();
      }
    });

    return () => {
      socket.off('vacation-update');
    };
  }, [page, filters]);

  const handleFollow = async (id: string) => {
    try {
      const scrollY = window.scrollY;
      await vacationsApi.follow(id);
      await fetchVacations();
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (error) {
      console.error('Error following vacation:', error);
    }
  };

  const handleUnfollow = async (id: string) => {
    try {
      const scrollY = window.scrollY;
      await vacationsApi.unfollow(id);
      await fetchVacations();
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (error) {
      console.error('Error unfollowing vacation:', error);
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
