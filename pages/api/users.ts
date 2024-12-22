import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../src/utils/mongodb';
import User, { IUser } from '../../src/models/User';

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse<IUser | IUser[] | null>>
) {
  try {
    await connectDB();

    switch (req.method) {
      case 'GET':
        try {
          const users = await User.find({}).select('-password');
          res.status(200).json({ data: users });
        } catch (error) {
          console.error('GET Error:', error);
          res.status(500).json({ error: 'Failed to fetch users' });
        }
        break;

      case 'POST':
        try {
          const user = await User.create(req.body);
          const { password, ...userWithoutPassword } = user.toObject();
          res.status(201).json({ data: userWithoutPassword as IUser });
        } catch (error) {
          console.error('POST Error:', error);
          res.status(500).json({ error: 'Failed to create user' });
        }
        break;

      case 'PUT':
        try {
          const { id, ...updateData } = req.body;
          const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
          ).select('-password');
          
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          res.status(200).json({ data: user });
        } catch (error) {
          console.error('PUT Error:', error);
          res.status(500).json({ error: 'Failed to update user' });
        }
        break;

      case 'DELETE':
        try {
          const { id } = req.body;
          const user = await User.findByIdAndDelete(id);
          
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
          console.error('DELETE Error:', error);
          res.status(500).json({ error: 'Failed to delete user' });
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Connection Error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
} 