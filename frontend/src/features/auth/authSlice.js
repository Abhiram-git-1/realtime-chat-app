import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authService from "./authService";

const storedToken = localStorage.getItem("accessToken");

const initialState = {
  user: null,
  accessToken: storedToken,
  isAuthenticated: Boolean(storedToken),
  initialized: false,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);

      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.getCurrentUser();

      const accessToken =
        localStorage.getItem("accessToken");

      if (!accessToken) {
        return {
          user: null,
          accessToken: null,
        };
      }

      return {
        ...data,
        accessToken,
      };
    } catch (error) {
      localStorage.removeItem("accessToken");

      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.logout();

      localStorage.removeItem("accessToken");

      return data;
    } catch (error) {
      localStorage.removeItem("accessToken");

      return rejectWithValue(
        error.data || {
          message: error.message,
        },
      );
    }
  },
);

export const logoutAllUsers = createAsyncThunk(
  "auth/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.logoutAll();

      localStorage.removeItem("accessToken");

      return data;
    } catch (error) {
      localStorage.removeItem("accessToken");

      return rejectWithValue(error.data || { message: error.message });
    }
  },
);

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },

    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = Boolean(user && accessToken);
    },

    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;

      localStorage.removeItem("accessToken");
    },

    updateAuthenticatedUser: (state, action) => {
      if (!state.user || !action.payload) {
        return;
      }

      state.user = {
        ...state.user,
        ...action.payload,
        id: action.payload.id || action.payload._id || state.user.id,
      };
    },
  },

  extraReducers: (builder) => {
    builder

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;

        state.isAuthenticated = Boolean(
          action.payload.user && action.payload.accessToken,
        );
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })

      // INITIALIZE
      .addCase(initializeAuth.pending, (state) => {
        state.initialized = false;
      })

      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initialized = true;

        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;

        state.isAuthenticated = Boolean(
          action.payload.user && action.payload.accessToken,
        );
      })

      .addCase(initializeAuth.rejected, (state) => {
        state.initialized = true;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      //logout all users 
      .addCase(logoutAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutAllUsers.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutAllUsers.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  clearAuthError,
  setCredentials,
  clearCredentials,
  updateAuthenticatedUser,
} =
  authSlice.actions;

export default authSlice.reducer;
