import React from 'react';
import { Vacation } from '../types';
import { getImageUrl } from '../services/api';
import './VacationCard.css';

interface VacationCardProps {
  vacation: Vacation;
  onFollow?: (id: string) => void;
  onUnfollow?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
}

const VacationCard: React.FC<VacationCardProps> = ({
  vacation,
  onFollow,
  onUnfollow,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  const handleFollowClick = () => {
    if (vacation.isFollowing && onUnfollow) {
      onUnfollow(vacation.vacationId);
    } else if (!vacation.isFollowing && onFollow) {
      onFollow(vacation.vacationId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/uploads/default.jpg';
  };

  return (
    <div className="vacation-card">
      <div className="vacation-image-container">
        <img
          src={getImageUrl(vacation.imageFileName)}
          alt={vacation.destination}
          className="vacation-image"
          onError={handleImageError}
        />
        {!isAdmin && (
          <button
            className={`follow-button ${vacation.isFollowing ? 'following' : ''}`}
            onClick={handleFollowClick}
          >
            <span className="heart-icon">{vacation.isFollowing ? '❤' : '🤍'}</span>
            <span className="followers-count">{vacation.followersCount || 0}</span>
          </button>
        )}
        {isAdmin && (
          <div className="admin-buttons">
            <button className="btn-edit" onClick={() => onEdit?.(vacation.vacationId)}>
              ✏ Edit
            </button>
            <button className="btn-delete" onClick={() => onDelete?.(vacation.vacationId)}>
              🗑 Delete
            </button>
          </div>
        )}
      </div>
      <div className="vacation-content">
        <h3 className="vacation-destination">{vacation.destination}</h3>
        <p className="vacation-dates">
          📅 {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
        </p>
        <p className="vacation-description">{vacation.description}</p>
        <p className="vacation-price">${vacation.price}</p>
      </div>
    </div>
  );
};

export default VacationCard;
