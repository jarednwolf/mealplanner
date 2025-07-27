import React, { useState } from 'react';
import { 
  HeartIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  LockClosedIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: number;
  servings: number;
  estimatedCost: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  tags: string[];
  description: string;
}

const RecipeBrowser: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Sample recipes data
  const sampleRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400',
      cookTime: 25,
      servings: 4,
      estimatedCost: 8.50,
      difficulty: 'Easy',
      cuisine: 'Mediterranean',
      tags: ['Healthy', 'Vegetarian', 'Gluten-Free'],
      description: 'A colorful and nutritious bowl packed with quinoa, fresh vegetables, and feta cheese.'
    },
    {
      id: '2',
      name: 'Thai Green Curry Chicken',
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
      cookTime: 35,
      servings: 6,
      estimatedCost: 12.00,
      difficulty: 'Medium',
      cuisine: 'Thai',
      tags: ['Spicy', 'Dairy-Free'],
      description: 'Authentic Thai green curry with tender chicken and vegetables in coconut milk.'
    },
    {
      id: '3',
      name: 'Classic Beef Tacos',
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
      cookTime: 20,
      servings: 4,
      estimatedCost: 10.00,
      difficulty: 'Easy',
      cuisine: 'Mexican',
      tags: ['Family-Friendly', 'Quick'],
      description: 'Seasoned ground beef tacos with fresh toppings and homemade salsa.'
    },
    {
      id: '4',
      name: 'Mushroom Risotto',
      image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400',
      cookTime: 45,
      servings: 4,
      estimatedCost: 9.00,
      difficulty: 'Hard',
      cuisine: 'Italian',
      tags: ['Vegetarian', 'Comfort Food'],
      description: 'Creamy Italian risotto with mixed mushrooms and parmesan cheese.'
    },
    {
      id: '5',
      name: 'Teriyaki Salmon Bowl',
      image: 'https://images.unsplash.com/photo-1580959375944-abd7e991f971?w=400',
      cookTime: 30,
      servings: 2,
      estimatedCost: 14.00,
      difficulty: 'Medium',
      cuisine: 'Japanese',
      tags: ['Healthy', 'High-Protein'],
      description: 'Glazed salmon with steamed rice and Asian vegetables.'
    },
    {
      id: '6',
      name: 'Veggie Buddha Bowl',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      cookTime: 20,
      servings: 2,
      estimatedCost: 7.00,
      difficulty: 'Easy',
      cuisine: 'American',
      tags: ['Vegan', 'Healthy', 'Meal-Prep'],
      description: 'Colorful bowl with roasted vegetables, chickpeas, and tahini dressing.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Recipes' },
    { id: 'quick', name: 'Quick & Easy' },
    { id: 'healthy', name: 'Healthy' },
    { id: 'vegetarian', name: 'Vegetarian' },
    { id: 'family', name: 'Family-Friendly' }
  ];

  const filteredRecipes = sampleRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'quick') return matchesSearch && recipe.cookTime <= 30;
    if (selectedCategory === 'healthy') return matchesSearch && recipe.tags.includes('Healthy');
    if (selectedCategory === 'vegetarian') return matchesSearch && (recipe.tags.includes('Vegetarian') || recipe.tags.includes('Vegan'));
    if (selectedCategory === 'family') return matchesSearch && recipe.tags.includes('Family-Friendly');
    
    return matchesSearch;
  });

  const handleLikeRecipe = (recipeId: string) => {
    if (likedRecipes.includes(recipeId)) {
      setLikedRecipes(likedRecipes.filter(id => id !== recipeId));
    } else {
      setLikedRecipes([...likedRecipes, recipeId]);
      if (likedRecipes.length === 0) {
        // Show login prompt after first like
        setTimeout(() => setShowLoginPrompt(true), 500);
      }
    }
  };

  const handleSaveRecipe = () => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex items-start">
          <LockClosedIcon className="h-6 w-6 text-gray-400 mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Sign up to save recipes</p>
            <p className="text-sm text-gray-600 mt-1">Create a free account to save your favorite recipes and add them to meal plans.</p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/login');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-600 px-4 py-2 text-sm hover:text-gray-800"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 6000 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Explore Delicious Recipes
        </h2>
        <p className="text-xl text-gray-600">
          Browse our collection of easy-to-make, budget-friendly recipes
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative">
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => handleLikeRecipe(recipe.id)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
              >
                {likedRecipes.includes(recipe.id) ? (
                  <HeartIconSolid className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
                recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {recipe.difficulty}
              </span>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{recipe.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {recipe.cookTime} min
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {recipe.servings} servings
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  ${recipe.estimatedCost.toFixed(2)}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <button
                onClick={handleSaveRecipe}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Recipe
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-xl p-6 max-w-sm border-2 border-green-600">
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
          <h3 className="font-semibold text-gray-900 mb-2">Love these recipes?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Sign up to save your favorites and get personalized meal plans!
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full"
          >
            Sign Up Free
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeBrowser; 