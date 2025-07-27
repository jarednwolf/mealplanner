import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  highlight: string;
  familySize: string;
}

const SocialProof: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      text: 'This app has completely transformed how we eat as a family. We\'re saving over $200 a month and eating healthier than ever!',
      highlight: 'Saving $200/month',
      familySize: 'Family of 4'
    },
    {
      id: '2',
      name: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      rating: 5,
      text: 'As a busy professional, I love how the app plans everything for me. I spend 80% less time figuring out what to cook.',
      highlight: '80% time saved',
      familySize: 'Single professional'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      rating: 5,
      text: 'The dietary restriction support is amazing! My daughter has allergies and the app makes meal planning stress-free.',
      highlight: 'Allergy-friendly',
      familySize: 'Family of 3'
    }
  ];

  const stats = [
    {
      icon: UserGroupIcon,
      value: '1,000+',
      label: 'Active Families',
      description: 'Trust us with their meal planning'
    },
    {
      icon: CurrencyDollarIcon,
      value: '$150-300',
      label: 'Average Monthly Savings',
      description: 'Per family using our app'
    },
    {
      icon: ClockIcon,
      value: '4-6hrs',
      label: 'Time Saved Weekly',
      description: 'On meal planning and shopping'
    },
    {
      icon: ChartBarIcon,
      value: '92%',
      label: 'User Satisfaction',
      description: 'Would recommend to friends'
    }
  ];

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Real Families, Real Savings
          </h2>
          <p className="text-xl text-gray-600">
            See what families are saying about their meal planning transformation
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-gray-50 rounded-lg p-6 relative">
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.familySize}</p>
                </div>
              </div>
              
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
              
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                {testimonial.highlight}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="border-t border-gray-200 pt-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Our Impact in Numbers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-lg font-medium text-gray-900 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges - update to be more realistic */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium text-gray-900">Featured In</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-700">Local News</div>
            <div className="text-2xl font-bold text-gray-700">Food Blogs</div>
            <div className="text-2xl font-bold text-gray-700">Parent Groups</div>
            <div className="text-2xl font-bold text-gray-700">Budget Living</div>
          </div>
        </div>

        {/* Customer Quote Highlight */}
        <div className="mt-16 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-8 w-8 text-yellow-400" />
                ))}
              </div>
              <p className="text-2xl font-medium text-gray-900 italic mb-6">
                "I was skeptical at first, but this app has genuinely changed our lives. 
                We eat better, waste less food, and have cut our grocery bill by 30%. 
                The AI suggestions are spot-on for our family's tastes!"
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
                  alt="James Wilson"
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">James Wilson</div>
                  <div className="text-gray-600">Father of two, saves $200+ monthly</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialProof; 