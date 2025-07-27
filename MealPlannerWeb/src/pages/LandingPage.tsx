import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  SparklesIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  HeartIcon,
  ShoppingCartIcon,
  CalendarIcon,
  ArrowRightIcon,
  CheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const benefits = [
    {
      icon: SparklesIcon,
      title: 'Personalized for Your Family',
      description: 'AI learns your tastes, dietary needs, and preferences to create perfect meal plans'
    },
    {
      icon: ClockIcon,
      title: 'Save 5 Hours Weekly',
      description: 'No more meal planning stress. Get your week planned in under 60 seconds'
    },
    {
      icon: HeartIcon,
      title: 'Everyone Eats Happy',
      description: 'Picky eaters? Allergies? We handle it all with meals your whole family will love'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Save $200+ Monthly',
      description: 'Smart shopping lists with real prices help you stick to your budget'
    }
  ];

  const dietaryOptions = [
    { name: 'Gluten-Free', image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=200&q=80' },
    { name: 'Vegetarian', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80' },
    { name: 'Keto', image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=200&q=80' },
    { name: 'Kid-Friendly', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80' },
    { name: 'Low-Carb', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80' },
    { name: 'Dairy-Free', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&q=80' }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Mom of 3",
      content: "Finally, meal planning that understands my chaos! Kids love the meals and I love the time saved.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80"
    },
    {
      name: "Mike D.",
      role: "Busy Professional",
      content: "Cut my grocery bill by $300/month and I'm eating healthier than ever. This is a game changer!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
    },
    {
      name: "Emily R.",
      role: "Family of 5",
      content: "The AI actually learns what we like! No more wasted food and everyone's dietary needs are met.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ShoppingCartIcon className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">MealPlanner</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-gray-900 px-4 py-2 font-medium transition-colors"
              >
                Login
              </Link>
              <button 
                onClick={handleGetStarted}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-md"
              >
                Try It Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Focus on Personalization */}
      <section className="relative min-h-[100vh] flex items-center pt-16 overflow-hidden">
        {/* Split Design */}
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-2 h-full">
            <div className="bg-gradient-to-br from-green-50 to-green-100"></div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80"
                alt="Family cooking together"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-green-50/50" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                <SparklesIcon className="h-4 w-4 mr-1" />
                AI-Powered Personalization
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Meal Planning That
                <span className="text-green-600 block">Knows Your Family</span>
              </h1>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Tell us your preferences once. Get perfectly personalized meal plans forever. 
                Save time, reduce waste, and make everyone happy at dinner.
              </p>
              
              {/* CTA with urgency */}
              <div className="space-y-4">
                <button 
                  onClick={handleGetStarted}
                  className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-xl flex items-center group"
                >
                  Start Your Free Trial
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Join 1,247 families</span> who started this week
                </p>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {testimonials.map((t, i) => (
                    <img 
                      key={i}
                      src={t.image} 
                      alt={t.name}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid key={i} className="h-5 w-5" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Rated 4.9/5 by families</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator - Moved to bottom */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg animate-bounce">
            <p className="text-sm font-medium text-gray-700">See how it works ↓</p>
          </div>
        </div>
      </section>

      {/* Dietary Preferences Showcase */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Diet & Preference
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From picky eaters to allergies, we create meals everyone will love
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {dietaryOptions.map((option, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl mb-2">
                  <img 
                    src={option.image} 
                    alt={option.name}
                    className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <p className="text-white font-medium p-3">{option.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              + 20 more dietary preferences and restrictions supported
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Visual */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meal Planning Made Simple
            </h2>
            <p className="text-xl text-gray-600">
              From overwhelmed to organized in 3 easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
                <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Tell Us About Your Family</h3>
                <p className="text-gray-600 mb-4">
                  Add family members, dietary needs, favorite cuisines, and your budget
                </p>
                <img 
                  src="https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&q=80" 
                  alt="Family preferences"
                  className="rounded-lg w-full h-40 object-cover"
                />
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRightIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
                <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">Get Your Personalized Plan</h3>
                <p className="text-gray-600 mb-4">
                  AI creates a week of meals tailored to your family's unique needs
                </p>
                <img 
                  src="https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80" 
                  alt="Meal calendar"
                  className="rounded-lg w-full h-40 object-cover"
                />
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRightIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
                <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Shop & Save</h3>
                <p className="text-gray-600 mb-4">
                  Get organized shopping lists with real prices. Order with one click!
                </p>
                <img 
                  src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80" 
                  alt="Grocery shopping"
                  className="rounded-lg w-full h-40 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits with Visuals */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Families Choose MealPlanner
            </h2>
            <p className="text-xl text-gray-600">
              More than meal planning - it's peace of mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                AI That Actually Gets Your Family
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Our AI learns from your feedback and adapts to your family's changing tastes. 
                No more meal plan roulette - get recipes you'll actually want to make.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Learns from your ratings and swaps</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Remembers what your kids actually eat</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Adjusts for seasonal preferences</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80" 
                alt="Personalized meals"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4">
                <p className="text-sm font-semibold text-gray-900">This week's favorites:</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <StarIconSolid className="h-4 w-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">98% match rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <img 
                src="https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=600&q=80" 
                alt="Family dinner"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4">
                <p className="text-2xl font-bold text-green-600">$247</p>
                <p className="text-sm text-gray-600">Saved this month</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Save Money Without Sacrificing Quality
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Our smart shopping algorithms find the best deals while keeping your meals delicious. 
                Average families save $200+ per month.
              </p>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-sm text-gray-600 mb-2">Average monthly savings:</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">$247</span>
                  <span className="text-gray-600">for a family of 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Families, Real Results
            </h2>
            <p className="text-xl text-gray-600">
              See why parents love MealPlanner
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIconSolid key={i} className="h-5 w-5" />
                  ))}
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-lg text-gray-600">
              Join <span className="font-semibold text-gray-900">1,247 families</span> who've transformed their mealtime
            </p>
          </div>
        </div>
      </section>

      {/* Sample Meal Plan */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Week, Planned to Perfection
            </h2>
            <p className="text-xl text-gray-600">
              Here's what a personalized week looks like
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { day: 'Mon', meal: 'Chicken Teriyaki', time: '25 min', price: '$8.50', image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=200&q=80' },
                { day: 'Tue', meal: 'Veggie Stir Fry', time: '20 min', price: '$7.25', image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=200&q=80' },
                { day: 'Wed', meal: 'Taco Tuesday', time: '30 min', price: '$9.00', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80' },
                { day: 'Thu', meal: 'Pasta Primavera', time: '25 min', price: '$6.75', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&q=80' },
                { day: 'Fri', meal: 'Fish & Chips', time: '35 min', price: '$10.50', image: 'https://images.unsplash.com/photo-1614891669421-964261109bb4?w=200&q=80' },
                { day: 'Sat', meal: 'BBQ Chicken', time: '40 min', price: '$11.00', image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=200&q=80' },
                { day: 'Sun', meal: 'Family Pizza', time: '15 min', price: '$12.00', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80' }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-4 shadow-md">
                  <p className="font-semibold text-gray-900 mb-2">{item.day}</p>
                  <img 
                    src={item.image}
                    alt={`${item.meal}`}
                    className="rounded-lg w-full h-20 object-cover mb-2"
                  />
                  <p className="text-sm text-gray-700 font-medium">{item.meal}</p>
                  <p className="text-xs text-gray-500">{item.time} • {item.price}</p>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center mt-8 gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">$127</p>
                <p className="text-sm text-gray-600">Total week cost</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">3.5 hrs</p>
                <p className="text-sm text-gray-600">Total cook time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600">Family approved</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button 
              onClick={handleGetStarted}
              className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg inline-flex items-center"
            >
              Get Your Personalized Plan
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Mealtime?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of families saving time, money, and stress
          </p>
          
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-white">
              <div>
                <p className="text-3xl font-bold">14 days</p>
                <p className="text-green-100">Free trial</p>
              </div>
              <div>
                <p className="text-3xl font-bold">No</p>
                <p className="text-green-100">Credit card required</p>
              </div>
              <div>
                <p className="text-3xl font-bold">Cancel</p>
                <p className="text-green-100">Anytime</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleGetStarted}
            className="bg-white text-green-600 px-10 py-5 rounded-xl text-xl font-bold hover:bg-gray-100 transition-all duration-200 shadow-xl inline-flex items-center group"
          >
            Start Your Free Trial Now
            <ArrowRightIcon className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-sm text-green-100 mt-6">
            <span className="font-semibold">98% of families</span> continue after their trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingCartIcon className="h-6 w-6 text-green-500" />
                <span className="text-lg font-bold text-white">MealPlanner</span>
              </div>
              <p className="text-sm">
                Making mealtime easier for families everywhere.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 MealPlanner. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 