'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  EyeIcon, HeartIcon, CalendarIcon, UserIcon, ShareIcon, 
  BookmarkIcon, LinkIcon, CheckIcon 
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useUser } from "@clerk/nextjs";
import Navbar from "@/components/navigation/navbar";
import { toast, Toaster } from 'react-hot-toast';
import { BlogPost } from '@/types/blog';

// Add this function to clean and format blog content
const formatBlogContent = (content: string): ReactNode[] => {
  // First, clean any markdown symbols
  const cleanContent = content
    .replace(/[#*`]/g, '')  // Remove markdown characters
    .replace(/^\s*[-•]\s*/gm, '') // Remove list markers
    .replace(/\n{3,}/g, '\n\n')  // Normalize line breaks
    .trim();

  // Split into paragraphs
  return cleanContent.split('\n\n').map((block, index) => {
    // Detect if this is a heading (short text that ends with ? or : or starts with capital)
    const isHeading = (block.length < 100 && 
      (block.endsWith('?') || block.endsWith(':') || /^[A-Z]/.test(block)));

    if (isHeading) {
      return (
        <motion.h2
          key={`heading-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="text-3xl font-bold text-gray-800 mt-16 mb-8 leading-tight
            tracking-tight relative flex items-center group"
        >
          <div className="absolute -left-4 w-1 h-8 bg-gradient-to-b from-purple-600 
            to-pink-600 rounded-full transform origin-left group-hover:scale-y-110 
            transition-transform duration-300"/>
          {block.trim()}
        </motion.h2>
      );
    }

    // Regular paragraphs with enhanced styling
    return (
      <motion.p
        key={`p-${index}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 }}
        className="text-lg text-gray-700 leading-relaxed mb-8 
          first-letter:text-4xl first-letter:font-bold first-letter:text-purple-700
          first-letter:mr-3 first-letter:float-left first-letter:leading-none
          hover:text-gray-900 transition-colors duration-300"
      >
        {block.trim()}
      </motion.p>
    );
  });
};

export default function BlogPostPage() {
  const router = useRouter();
  const { user } = useUser();
  const params = useParams();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

  // Load blog and check saved/following status
  useEffect(() => {
    const loadBlog = () => {
      const savedPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
      const foundBlog = savedPosts.find((post: BlogPost) => post.slug === slug);
      
      if (foundBlog) {
        // Increment page views
        foundBlog.pageViews = (foundBlog.pageViews || 0) + 1;
        localStorage.setItem('blogPosts', JSON.stringify(
          savedPosts.map((post: BlogPost) => 
            post.slug === slug ? foundBlog : post
          )
        ));
        
        setBlog(foundBlog);
        setIsSaved(foundBlog.savedBy?.includes(user?.id || ''));
        setIsFollowing(foundBlog.followers?.includes(user?.id || ''));
      }
    };

    if (user) {
      loadBlog();
    }
  }, [slug, user]);

  // Load related posts
  useEffect(() => {
    if (blog) {
      const allPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
      const related = allPosts
        .filter((post: BlogPost) => post.slug !== blog.slug)
        .slice(0, 3);
      setRelatedPosts(related);
    }
  }, [blog]);

  const handleSave = () => {
    if (!user) {
      toast.error('Please sign in to save posts');
      return;
    }

    const savedPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    const updatedPosts = savedPosts.map((post: BlogPost) => {
      if (post.slug === blog?.slug) {
        const savedBy = post.savedBy || [];
        if (isSaved) {
          post.savedBy = savedBy.filter(id => id !== user.id);
        } else {
          post.savedBy = [...savedBy, user.id];
        }
      }
      return post;
    });

    localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Post removed from saved' : 'Post saved successfully');
  };

  const handleFollow = () => {
    if (!user) {
      toast.error('Please sign in to follow');
      return;
    }

    const savedPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    const updatedPosts = savedPosts.map((post: BlogPost) => {
      if (post.slug === blog?.slug) {
        const followers = post.followers || [];
        if (isFollowing) {
          post.followers = followers.filter(id => id !== user.id);
        } else {
          post.followers = [...followers, user.id];
        }
      }
      return post;
    });

    localStorage.setItem('blogPosts', JSON.stringify(updatedPosts));
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 'Unfollowed successfully' : 'Following successfully');
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleViewMore = () => {
    router.push('/dashboard/youtube-blogs');
  };

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700">Blog post not found</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-black">
        <Navbar />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-16"
      >
        {/* Hero Section */}
        <div className="relative h-[70vh] w-full overflow-hidden mt-16">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            src={blog.metadata.thumbnail}
            alt={blog.title}
            className="w-full h-full object-cover object-center"
          />

          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-7xl font-black text-white mb-6 leading-tight tracking-tight"
              >
                {blog.title}
              </motion.h1>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center space-x-8 text-white/90"
              >
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-lg">{blog.metadata.views} views</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HeartIcon className="h-5 w-5 text-pink-400" />
                  <span className="text-lg">{blog.metadata.likes} likes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-lg">{blog.metadata.channelTitle}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 -mt-32 relative z-30">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Author and Date Section */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {user?.imageUrl && (
                    <div className="relative">
                      <img 
                        src={user.imageUrl} 
                        alt={user.fullName || 'User'} 
                        className="w-14 h-14 rounded-full border-2 border-purple-500 shadow-lg ring-4 ring-white"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {user?.fullName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {new Date(blog.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors group relative"
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <ShareIcon className="w-5 h-5 text-gray-600 group-hover:text-purple-600" />
                    )}
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Share
                    </span>
                  </button>
                  <button 
                    onClick={handleSave}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors group relative"
                  >
                    {isSaved ? (
                      <BookmarkSolidIcon className="w-5 h-5 text-purple-600" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5 text-gray-600 group-hover:text-purple-600" />
                    )}
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {isSaved ? 'Saved' : 'Save'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-12">
              <div className="prose prose-lg max-w-none">
                <div className="space-y-6 relative">
                  {formatBlogContent(blog.content)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-blue-800">
              <div className="px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={user?.imageUrl} 
                      alt={user?.fullName || 'User'} 
                      className="w-16 h-16 rounded-full border-2 border-purple-500 shadow-xl p-0.5 bg-white"
                    />
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Written by {user?.fullName}
                      </h3>
                      <p className="text-gray-600">{user?.emailAddresses[0]?.emailAddress}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-full transition-all duration-300 ${
                        isFollowing 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={handleViewMore}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                      More articles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Articles */}
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedPosts.length > 0 ? (
              relatedPosts.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/youtube-blogs/${post.slug}`}
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={post.metadata.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center space-x-2 text-white/90 text-sm">
                          <EyeIcon className="h-4 w-4" />
                          <span>{post.metadata.views} views</span>
                          <HeartIcon className="h-4 w-4 ml-2" />
                          <span>{post.metadata.likes} likes</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={user?.imageUrl}
                          alt={user?.fullName || 'Author'}
                          className="w-8 h-8 rounded-full border border-purple-500"
                        />
                        <span className="text-sm text-gray-600">
                          {user?.fullName || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-gray-500">No related articles found</div>
              </div>
            )}
          </div>
        </div>

        {/* Add view count */}
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <EyeIcon className="w-4 h-4 mr-1" />
          {blog?.pageViews || 0} page views
        </div>

        {/* Add Toaster */}
        <Toaster position="top-center" />
      </motion.div>
    </>
  );
}