import { X, ExternalLink, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

function TrendingTopicsModal({ isOpen, onClose, topics, onSelect, activeCategory, onRefresh, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-1 shadow-2xl backdrop-blur-xl dark:bg-gray-900/40">
        <div className="relative overflow-hidden rounded-[2.3rem] bg-white dark:bg-gray-800">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeCategory}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Select a real-time topic to manifest into growth.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all hover:bg-gray-100 hover:text-studio-primary dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all hover:bg-gray-100 hover:text-rose-500 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Topics List */}
          <div className="studio-scrollbar max-h-[60vh] overflow-y-auto overflow-x-hidden p-4">
            {loading ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-studio-primary border-t-transparent" />
                <p className="text-sm font-medium text-gray-500">Scouting the digital world...</p>
              </div>
            ) : topics.length > 0 ? (
              <div className="grid gap-3">
                {topics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(topic)}
                    className="group relative flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-studio-primary/30 hover:bg-white hover:shadow-soft dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-studio-primary/10 font-bold text-studio-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold leading-relaxed text-gray-900 group-hover:text-studio-primary dark:text-white">
                        {topic}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 group-hover:text-studio-primary">
                      <ExternalLink size={16} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <p className="text-gray-500">No real-time topics found. Try refreshing.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 dark:bg-gray-800/50">
            <p className="text-center text-[11px] font-medium uppercase tracking-widest text-gray-400">
              Data sourced from live Reddit & GNews feeds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendingTopicsModal;
