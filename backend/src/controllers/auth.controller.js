import {
  createAuthToken,
  createUser,
  findUserByEmail,
  hashPassword,
  updateUserProfile,
  verifyPassword
} from "../services/auth.service.js";

function toUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    createdAt: user.createdAt
  };
}

export async function registerController(req, res) {
  const { name, email, password, avatar = "" } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, message: "name, email, and password are required" });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: "An account already exists for this email" });
  }

  const user = await createUser({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashPassword(password),
    avatar
  });

  return res.status(201).json({
    success: true,
    data: {
      token: createAuthToken(String(user._id)),
      user: toUserResponse(user)
    }
  });
}

export async function loginController(req, res) {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, message: "email and password are required" });
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  return res.status(200).json({
    success: true,
    data: {
      token: createAuthToken(String(user._id)),
      user: toUserResponse(user)
    }
  });
}

export async function meController(req, res) {
  return res.status(200).json({
    success: true,
    data: toUserResponse(req.user)
  });
}

export async function updateProfileController(req, res) {
  const { name, avatar = "" } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "name is required" });
  }

  const updatedUser = await updateUserProfile(req.user._id, {
    name: name.trim(),
    avatar
  });

  return res.status(200).json({
    success: true,
    data: toUserResponse(updatedUser)
  });
}
