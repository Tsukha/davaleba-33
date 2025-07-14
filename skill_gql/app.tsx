import React, { useState } from "react";
import {
  Star,
  Plus,
  Edit3,
  Trash2,
  Gamepad2,
  User,
  MessageSquare,
} from "lucide-react";

interface Game {
  id: string;
  title: string;
  platform: string[];
  reviews?: Review[];
}

interface Author {
  id: string;
  name: string;
  verified: boolean;
  reviews?: Review[];
}

interface Review {
  id: string;
  rating: number;
  content: string;
  author: Author;
  game: Game;
}

interface AddGameInput {
  title: string;
  platform: string[];
}

interface EditGameInput {
  title?: string;
  platform?: string[];
}

class GraphQLClient {
  private baseURL = "http://localhost:4000";

  async query<T>(query: string, variables?: any): Promise<T> {
    const response = await fetch(this.baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  }
}

const client = new GraphQLClient();

const GET_GAMES = `
  query GetGames {
    games {
      id
      title
      platform
      reviews {
        id
        rating
        content
        author {
          id
          name
          verified
        }
      }
    }
  }
`;

const GET_GAME = `
  query GetGame($id: ID!) {
    game(id: $id) {
      id
      title
      platform
      reviews {
        id
        rating
        content
        author {
          id
          name
          verified
        }
      }
    }
  }
`;

const GET_AUTHORS = `
  query GetAuthors {
    authors {
      id
      name
      verified
      reviews {
        id
        rating
        content
        game {
          id
          title
        }
      }
    }
  }
`;

const ADD_GAME = `
  mutation AddGame($game: AddGameInput!) {
    addGame(game: $game) {
      id
      title
      platform
    }
  }
`;

const UPDATE_GAME = `
  mutation UpdateGame($id: ID!, $edits: EditGameInput!) {
    updateGame(id: $id, edits: $edits) {
      id
      title
      platform
    }
  }
`;

const DELETE_GAME = `
  mutation DeleteGame($id: ID!) {
    deleteGame(id: $id) {
      id
      title
      platform
    }
  }
`;

const useGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.query<{ games: Game[] }>(GET_GAMES);
      setGames(data.games);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addGame = async (gameInput: AddGameInput) => {
    try {
      const data = await client.query<{ addGame: Game }>(ADD_GAME, {
        game: gameInput,
      });
      setGames((prev) => [...prev, data.addGame]);
      return data.addGame;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const updateGame = async (id: string, edits: EditGameInput) => {
    try {
      const data = await client.query<{ updateGame: Game }>(UPDATE_GAME, {
        id,
        edits,
      });
      setGames((prev) =>
        prev.map((game) => (game.id === id ? data.updateGame : game))
      );
      return data.updateGame;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const deleteGame = async (id: string) => {
    try {
      await client.query<{ deleteGame: Game[] }>(DELETE_GAME, { id });
      setGames((prev) => prev.filter((game) => game.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  return {
    games,
    loading,
    error,
    fetchGames,
    addGame,
    updateGame,
    deleteGame,
  };
};

const useAuthors = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.query<{ authors: Author[] }>(GET_AUTHORS);
      setAuthors(data.authors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    authors,
    loading,
    error,
    fetchAuthors,
  };
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
    </div>
  );
};

const GameCard: React.FC<{
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
}> = ({ game, onEdit, onDelete }) => {
  const averageRating = game.reviews?.length
    ? game.reviews.reduce((sum, review) => sum + review.rating, 0) /
      game.reviews.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{game.title}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {game.platform.map((platform) => (
              <span
                key={platform}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {platform}
              </span>
            ))}
          </div>
          {game.reviews && game.reviews.length > 0 && (
            <StarRating rating={Math.round(averageRating)} />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(game)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(game.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {game.reviews && game.reviews.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Reviews ({game.reviews.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {game.reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className="font-medium text-sm">
                      {review.author.name}
                    </span>
                    {review.author.verified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm text-gray-700">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GameForm: React.FC<{
  game?: Game;
  onSubmit: (gameInput: AddGameInput) => void;
  onCancel: () => void;
}> = ({ game, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(game?.title || "");
  const [platforms, setPlatforms] = useState<string[]>(game?.platform || []);
  const [newPlatform, setNewPlatform] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && platforms.length > 0) {
      onSubmit({ title: title.trim(), platform: platforms });
    }
  };

  const addPlatform = () => {
    if (newPlatform.trim() && !platforms.includes(newPlatform.trim())) {
      setPlatforms([...platforms, newPlatform.trim()]);
      setNewPlatform("");
    }
  };

  const removePlatform = (platform: string) => {
    setPlatforms(platforms.filter((p) => p !== platform));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {game ? "Edit Game" : "Add New Game"}
        </h2>
        <div onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platforms
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addPlatform())
                }
                placeholder="Add platform..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addPlatform}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                >
                  {platform}
                  <button
                    type="button"
                    onClick={() => removePlatform(platform)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {game ? "Update" : "Add"} Game
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthorCard: React.FC<{ author: Author }> = ({ author }) => {
  const averageRating = author.reviews?.length
    ? author.reviews.reduce((sum, review) => sum + review.rating, 0) /
      author.reviews.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <User className="w-8 h-8 text-gray-600 mr-3" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">{author.name}</h3>
          {author.verified && (
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Verified
            </span>
          )}
        </div>
      </div>

      {author.reviews && author.reviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {author.reviews.length} review
              {author.reviews.length !== 1 ? "s" : ""}
            </span>
            <StarRating rating={Math.round(averageRating)} />
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {author.reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {review.game.title}
                  </span>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm text-gray-700">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const {
    games,
    loading: gamesLoading,
    error: gamesError,
    fetchGames,
    addGame,
    updateGame,
    deleteGame,
  } = useGames();
  const {
    authors,
    loading: authorsLoading,
    error: authorsError,
    fetchAuthors,
  } = useAuthors();
  const [activeTab, setActiveTab] = useState<"games" | "authors">("games");
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  React.useEffect(() => {
    fetchGames();
    fetchAuthors();
  }, []);

  const handleAddGame = async (gameInput: AddGameInput) => {
    try {
      await addGame(gameInput);
      setShowGameForm(false);
    } catch (error) {
      console.error("Error adding game:", error);
    }
  };

  const handleUpdateGame = async (gameInput: AddGameInput) => {
    if (!editingGame) return;
    try {
      await updateGame(editingGame.id, gameInput);
      setEditingGame(null);
    } catch (error) {
      console.error("Error updating game:", error);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this game?")) {
      try {
        await deleteGame(id);
      } catch (error) {
        console.error("Error deleting game:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <GamepadIcon className="w-8 h-8 mr-3 text-blue-600" />
            Game Reviews
          </h1>

          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg shadow-sm">
              <button
                onClick={() => setActiveTab("games")}
                className={`px-4 py-2 rounded-l-lg ${
                  activeTab === "games"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Games
              </button>
              <button
                onClick={() => setActiveTab("authors")}
                className={`px-4 py-2 rounded-r-lg ${
                  activeTab === "authors"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Authors
              </button>
            </div>

            {activeTab === "games" && (
              <button
                onClick={() => setShowGameForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Game
              </button>
            )}
          </div>
        </div>

        {gamesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading games: {gamesError}
          </div>
        )}

        {authorsError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading authors: {authorsError}
          </div>
        )}

        {activeTab === "games" && (
          <div>
            {gamesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading games...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onEdit={setEditingGame}
                    onDelete={handleDeleteGame}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "authors" && (
          <div>
            {authorsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading authors...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authors.map((author) => (
                  <AuthorCard key={author.id} author={author} />
                ))}
              </div>
            )}
          </div>
        )}

        {(showGameForm || editingGame) && (
          <GameForm
            game={editingGame || undefined}
            onSubmit={editingGame ? handleUpdateGame : handleAddGame}
            onCancel={() => {
              setShowGameForm(false);
              setEditingGame(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default App;
