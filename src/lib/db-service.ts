import { prisma } from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';

export const dbService = {
  async ensureUser(clerkUserId: string) {
    try {
      // First try to find the user
      let user = await prisma.user.findFirst({
        where: { clerkId: clerkUserId }
      });

      // If user doesn't exist, create them
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        user = await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            name: clerkUser.firstName + ' ' + clerkUser.lastName,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            image: clerkUser.imageUrl,
          }
        });
      }

      return user;
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  },

  async createComment(data: {
    blogSlug: string;
    content: string;
    userId: string;
    parentId?: string;
  }) {
    try {
      const user = await this.ensureUser(data.userId);
      
      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          blogSlug: data.blogSlug,
          userId: user.id,
          parentId: data.parentId,
          likedBy: [],
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return comment;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  },

  async getComments(blogSlug: string, sortBy: 'newest' | 'oldest' | 'mostLiked' = 'newest') {
    try {
      return await prisma.comment.findMany({
        where: {
          blogSlug,
          parentId: null,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          ...(sortBy === 'newest' && { createdAt: 'desc' }),
          ...(sortBy === 'oldest' && { createdAt: 'asc' }),
          ...(sortBy === 'mostLiked' && { likes: 'desc' }),
        },
      });
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  },

  async deleteComment(commentId: string, clerkUserId: string) {
    try {
      const user = await this.ensureUser(clerkUserId);
      await prisma.comment.deleteMany({
        where: {
          id: commentId,
          userId: user.id,
        },
      });
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  },

  async toggleLike(commentId: string, clerkUserId: string) {
    try {
      const user = await this.ensureUser(clerkUserId);
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          likes: true,
          likedBy: true
        }
      });

      if (!comment) throw new Error('Comment not found');

      const isLiked = comment.likedBy.includes(user.id);

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: isLiked ? comment.likes - 1 : comment.likes + 1,
          likedBy: isLiked
            ? { set: comment.likedBy.filter(id => id !== user.id) }
            : { push: user.id }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return {
        likes: updatedComment.likes,
        isLiked: !isLiked
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  },

  async getCommentCount(blogSlug: string) {
    try {
      return await prisma.comment.count({
        where: { blogSlug },
      });
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  },
}; 
