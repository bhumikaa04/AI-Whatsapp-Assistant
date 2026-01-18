import { useState , useEffect } from "react";
import axios from "../../services/api"; 

export default function Profile() {
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    country: "India",
    phone: "",
    otp: ""
  });

  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await axios.get("/user/profile");

      const user = res.data.user;

      setForm({
        name: user.name,
        businessName: user.businessName,
        email: user.email,
        country: user.country,
        phone: user.phone,
        otp: ""
      });

      setPhoneVerified(user.phoneVerified);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchProfile();
}, []);


  const sendOtp = async () => {
    if (!form.phone) return alert("Enter mobile number");

    try {
      setLoading(true);
      await axios.post("/auth/send-otp", { phoneNumber: form.phone });
      setOtpSent(true);
      alert("OTP sent successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      await axios.post("/auth/verify-otp", {
        phoneNumber: form.phone,
        otp: form.otp
      });
      setPhoneVerified(true);
      alert("Phone number verified");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      await axios.put("/user/profile", {
        name: form.name,
        businessName: form.businessName,
        country: form.country,
        phoneNumber: form.phone,
      });
      alert("Profile updated successfully");
    } catch (err) {
      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-grow bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Profile Settings
            </h1>

            <div className="grid gap-5">
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="input"
              />

              <input
                name="email"
                value={form.email}
                disabled={phoneVerified}
                className="input bg-gray-100 cursor-not-allowed"
              />

              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className="input"
              />

              {/* Optional Phone Verification Section */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mobile Number (Optional)
                </label>

                <div className="flex gap-3 mt-2">
                  <input
                    name="phone"
                    placeholder="+91XXXXXXXXXX"
                    value={form.phone}
                    disabled={phoneVerified}
                    onChange={handleChange}
                    className="input flex-1"
                  />

                  {!phoneVerified && form.phone && (
                    <button
                      onClick={sendOtp}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Verify Now
                    </button>
                  )}

                  {phoneVerified && (
                    <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm flex items-center">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              {otpSent && !phoneVerified && (
                <div className="flex gap-3">
                  <input
                    name="otp"
                    placeholder="Enter OTP"
                    value={form.otp}
                    onChange={handleChange}
                    className="input flex-1"
                  />
                  <button
                    onClick={verifyOtp}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Confirm
                  </button>
                </div>
              )}

              {/* CHANGE: Removed !phoneVerified from disabled prop. 
                  Now only 'loading' can disable the save button.
              */}
              <button
                onClick={saveProfile}
                disabled={loading}
                className="mt-4 w-full py-3 rounded-lg bg-[#4F46E5] text-white font-medium disabled:opacity-50 hover:bg-[#4338CA] transition-all"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}