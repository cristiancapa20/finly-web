import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const validUsername = process.env.AUTH_USERNAME;
        const validPasswordHash = process.env.AUTH_PASSWORD_HASH;

        if (!validUsername || !validPasswordHash) {
          return null;
        }

        if (credentials.username !== validUsername) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          validPasswordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: "1",
          name: validUsername,
          email: `${validUsername}@local`,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
