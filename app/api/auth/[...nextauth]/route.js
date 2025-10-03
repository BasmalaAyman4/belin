// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SESSION_CONFIG } from "@/config/api.config";

const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        id: { label: "ID", type: "text" },
        mobile: { label: "Mobile", type: "text" },
        token: { label: "Token", type: "text" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" },
        address: { label: "Address", type: "text" }
      },

      async authorize(credentials) {
        try {
          if (!credentials?.token || !credentials?.id) {
            console.error("Missing credentials in authorize");
            return null;
          }

          return {
            id: credentials.id,
            mobile: credentials.mobile,
            firstName: credentials.firstName,
            lastName: credentials.lastName,
            address: credentials.address || null,
            accessToken: credentials.token,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.mobile = user.mobile;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.address = user.address;
        token.accessToken = user.accessToken;
        token.tokenIssuedAt = Date.now();
        token.tokenExpiresAt = Date.now() + SESSION_CONFIG.TOKEN_EXPIRY_MS;
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.firstName = session.firstName || token.firstName;
        token.lastName = session.lastName || token.lastName;
        token.address = session.address || token.address;
      }

      // Check token expiration
      if (token.tokenExpiresAt && Date.now() > token.tokenExpiresAt) {
        // Try to refresh token
        try {
          const refreshedToken = await refreshAccessToken(token.accessToken);
          if (refreshedToken) {
            token.accessToken = refreshedToken.accessToken;
            token.tokenIssuedAt = Date.now();
            token.tokenExpiresAt = Date.now() + SESSION_CONFIG.TOKEN_EXPIRY_MS;
          } else {
            // Token refresh failed - return null to force re-authentication
            console.warn("Token refresh failed, forcing re-authentication");
            return null;
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          return null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Validate token
      if (!token || !token.accessToken) {
        return null;
      }

      // Check if token is still valid
      if (token.tokenExpiresAt && Date.now() > token.tokenExpiresAt) {
        return null;
      }

      // Populate session with user data
      session.user = {
        id: token.id,
        mobile: token.mobile,
        firstName: token.firstName,
        lastName: token.lastName,
        address: token.address,
      };

      // Keep access token server-side only - DO NOT expose to client
      // This is stored in the token and can be accessed server-side
      session.tokenExpiresAt = token.tokenExpiresAt;

      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: SESSION_CONFIG.MAX_AGE,
    updateAge: SESSION_CONFIG.UPDATE_AGE,
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Changed to 'lax' for better compatibility
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_CONFIG.MAX_AGE,
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },

  pages: {
    signIn: "/en/signin",
    error: "/en/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',

  events: {
    async signOut({ token }) {
      // Invalidate token on backend when user signs out
      if (token?.accessToken) {
        await invalidateTokenOnAPI(token.accessToken);
      }
    },
    async signIn({ user }) {
      if (process.env.NODE_ENV === 'development') {
        console.log("User signed in:", user.id);
      }
    },
  },
};

/**
 * Refresh access token from backend
 * @param {string} token - Current access token
 * @returns {Object|null} - New token data or null if refresh failed
 */
async function refreshAccessToken(token) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    return {
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken || data.token
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

/**
 * Invalidate token on backend
 * @param {string} token - Access token to invalidate
 */
async function invalidateTokenOnAPI(token) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Token invalidation failed:', error);
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };