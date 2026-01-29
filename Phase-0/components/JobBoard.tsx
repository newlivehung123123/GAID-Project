import React from 'react';
import { JobOpportunity } from '../types';
import ScrollReveal from './ScrollReveal';
import TypewriterText from './TypewriterText';

interface JobBoardProps {
  jobs: JobOpportunity[];
}

const JobBoard: React.FC<JobBoardProps> = ({ jobs }) => {
  return (
    <ScrollReveal className="bg-gray-900 border border-gray-800 rounded-sm p-6 mb-16 relative overflow-hidden">
      {/* Decorative tech line */}
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/30"></div>
      
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 relative z-10">
        <TypewriterText 
          text="AI Opportunities Board" 
          tag="h2" 
          className="text-2xl font-orbitron font-bold text-white"
          speed={50}
          repeat={false}
        />
        <span className="text-sm text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider transition-colors cursor-pointer">
          View All Positions &rarr;
        </span>
      </div>
      
      <div className="flex flex-col gap-4 relative z-10">
        {jobs.map((job, idx) => (
          <ScrollReveal key={job.id} staggerIndex={idx} delay={200}>
            <div className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded bg-gray-950 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute left-0 top-0 w-0.5 h-full bg-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
              <div>
                <h3 className="text-lg font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                  {job.role}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  <span className="text-white font-medium">{job.company}</span> &bull; {job.location}
                </p>
              </div>
              <div className="mt-3 sm:mt-0 flex flex-col items-start sm:items-end">
                <span className={`text-xs font-bold px-2 py-1 rounded mb-1 border border-opacity-20 ${
                  job.type === 'Remote' ? 'bg-green-900/20 text-green-300 border-green-500' :
                  job.type === 'Hybrid' ? 'bg-purple-900/20 text-purple-300 border-purple-500' :
                  'bg-blue-900/20 text-blue-300 border-blue-500'
                }`}>
                  {job.type}
                </span>
                <span className="text-xs text-gray-500">{job.posted}</span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  );
};

export default JobBoard;