import { User, IUser } from '../models/User';
import { generateToken } from '../lib/auth';
import { RegisterInput, LoginInput, AuthPayload } from '../lib/types';

export async function registerUser(input: RegisterInput): Promise<AuthPayload> {
  const { email, username, password } = input;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new Error('Email already in use');
    }
    throw new Error('Username already taken');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const user = new User({ email, username, password });
  await user.save();

  const token = generateToken(user);
  return { token, user: user.toJSON() };
}

export async function loginUser(input: LoginInput): Promise<AuthPayload> {
  const { email, password } = input;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user);
  return { token, user: user.toJSON() };
}

export async function getUserById(id: string): Promise<IUser | null> {
  return User.findById(id).exec();
}

export async function getUserProfile(userId: string): Promise<IUser | null> {
  return User.findById(userId).exec();
}
