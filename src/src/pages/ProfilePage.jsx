import { useEffect, useState } from "react";
import { Camera, Save } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../firebase";
import { getUserProfile, updateUserProfile, uploadFile } from "../services/firestoreService";

export default function ProfilePage({ user, profile, refreshProfile }) {
  const [form, setForm] = useState({ name: profile?.name || "", photoURL: profile?.photoURL || "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setForm({ name: profile?.name || "", photoURL: profile?.photoURL || "" });
  }, [profile]);

  const handleFileSelection = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      let photoURL = form.photoURL;
      if (file) {
        photoURL = await uploadFile(file, "profiles");
      }

      await updateUserProfile(user.uid, {
        name: form.name,
        photoURL,
      });

      const updatedProfile = await getUserProfile(user.uid);
      refreshProfile(updatedProfile);
      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Unable to update profile right now.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!auth.currentUser?.email) {
      setPasswordError("Your session is not authenticated. Please sign in again.");
      return;
    }

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(passwordForm.newPassword)) {
      setPasswordError("Password must include uppercase, lowercase, a number, and a special character.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordForm.newPassword);
      setPasswordSuccess("Password updated successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        setPasswordError("The current password you entered is incorrect.");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordError("Please re-enter your current password and try again.");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Please choose a stronger password.");
      } else {
        setPasswordError("We could not update your password right now.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <p className="eyebrow">Account overview</p>
          <h2>Profile</h2>
        </div>
      </div>

      {message ? <div className="success-banner">{message}</div> : null}

      <form className="glass-form" onSubmit={handleSubmit}>
        <div className="profile-hero">
          <div className="avatar-circle large">
            {form.photoURL ? (
              <img src={form.photoURL} alt="profile" />
            ) : (
              (form.name || user?.email || "U").charAt(0).toUpperCase()
            )}
          </div>
          <label className="upload-card wide">
            <Camera size={18} />
            <span>{file ? file.name : "Upload profile photo"}</span>
            <input type="file" accept="image/*" onChange={handleFileSelection} />
          </label>
        </div>

        <div className="input-grid">
          <input placeholder="Display name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input value={user?.email || ""} disabled />
          <input value={profile?.role || "user"} disabled />
          <input value={profile?.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString() : "Joined recently"} disabled />
        </div>

        <button className="primary-btn" type="submit" disabled={saving}>
          <Save size={16} /> {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form className="glass-form" onSubmit={handlePasswordChange}>
        <h3>Change password</h3>
        {passwordError ? <div className="error-banner">{passwordError}</div> : null}
        {passwordSuccess ? <div className="success-banner">{passwordSuccess}</div> : null}

        <div className="input-grid">
          <input
            type="password"
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
          />
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.newPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={passwordForm.confirmPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
          />
        </div>

        <button className="primary-btn" type="submit" disabled={passwordLoading}>
          {passwordLoading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
