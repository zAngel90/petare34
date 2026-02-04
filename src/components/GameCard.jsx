import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import './GameCard.css';

const GameCard = ({ game }) => {
  // Generate a random gradient for demo purposes
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];

  const gradient = gradients[game.id % gradients.length];

  return (
    <Link to={`/games/${game.id}`} className="game-card">
      <div className="game-image" style={{ background: gradient }}>
        <div className="game-overlay">
          <span className="game-category">{game.category}</span>
        </div>
      </div>
      <div className="game-info">
        <h3 className="game-name">{game.name}</h3>
        <div className="game-stats">
          <Users size={14} />
          <span>{game.players} jugando</span>
        </div>
      </div>
      <div className="game-arrow">
        <ChevronRight size={20} />
      </div>
    </Link>
  );
};

export default GameCard;
