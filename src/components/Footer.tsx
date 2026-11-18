import React from 'react';
import { Compass } from 'lucide-react';
import type { AppRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#08245E] text-white mt-20 no-print">
      <div className="max-w-[1440px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <div className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight mb-3">
            <Compass className="w-5 h-5 text-[#60A5FA]" />
            <span>TravelMate</span>
          </div>
          <p className="text-sm text-blue-100/80 leading-relaxed mb-4">
            Plan Smarter. Travel Safer. Explore Better. Pakistan&apos;s unified smart tourism
            platform connecting travelers with verified local guides, lodges, and 4x4 transport.
          </p>
          <p className="text-xs text-blue-200/80 font-mono tabular-nums">
            Currency: PKR · Northern Pakistan &amp; Nationwide
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 text-white">Explore</h3>
          <ul className="space-y-2 text-sm text-blue-100/75">
            <li>
              <button type="button" onClick={() => onNavigate('home')} className="hover:text-white cursor-pointer">
                Home Overview
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('destinations')} className="hover:text-white cursor-pointer">
                14 Northern Destinations
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('guides')} className="hover:text-white cursor-pointer">
                Verified Local Guides
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('packages')} className="hover:text-white cursor-pointer">
                Tour Packages &amp; Stays
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('ai-planner')} className="hover:text-white cursor-pointer">
                AI Trip Planner
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 text-white">Community &amp; Safety</h3>
          <ul className="space-y-2 text-sm text-blue-100/75">
            <li>
              <button type="button" onClick={() => onNavigate('travel-buddy')} className="hover:text-white cursor-pointer">
                Travel Buddy Matching
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('safety')} className="hover:text-white cursor-pointer">
                Emergency SOS Center
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('safety')} className="hover:text-white cursor-pointer">
                Live Mountain Weather
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('safety')} className="hover:text-white cursor-pointer">
                Official NHA / NDMA Advisories
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 text-white">Pakistan Emergency Helplines</h3>
          <div className="space-y-2 text-sm text-blue-100/85 font-mono tabular-nums">
            <div>Rescue 1122: 1122</div>
            <div>Police Emergency: 15</div>
            <div>Tourist Police Helpline: 1422</div>
            <div>Motorway / NHA Helpline: 130</div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-200/75">
          <span>TravelMate Smart Tourism Platform · Built for Pakistan Travel</span>
          <span>All prices displayed in Pakistani Rupee (PKR)</span>
        </div>
      </div>
    </footer>
  );
}
