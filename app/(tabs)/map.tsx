import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

interface ProblemArea {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  type: "contamination" | "shortage" | "infrastructure" | "quality" | "other";
  severity: "low" | "medium" | "high" | "critical";
  reportCount: number;
  verifiedCount: number;
  radius: number; // in meters
  isVerified: boolean;
  lastUpdated: Date;
  reports: string[]; // report IDs
}

interface AuthorityVerification {
  areaId: string;
  secretKey: string;
  officialName: string;
  department: string;
  timestamp: Date;
}

const AUTHORITY_SECRET_KEYS = [
  "WATER_DEPT_2024_SECURE",
  "MUNICIPAL_AUTH_KEY_2024",
  "HEALTH_DEPT_VERIFY_2024",
];

export default function MapScreen() {
  const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<ProblemArea | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    secretKey: "",
    officialName: "",
    department: "",
  });
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    getCurrentLocation();
    loadProblemAreas();
    generateProblemAreasFromReports();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to show your position on the map."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const loadProblemAreas = async () => {
    try {
      const savedAreas = await AsyncStorage.getItem("problemAreas");
      if (savedAreas) {
        const parsedAreas = JSON.parse(savedAreas).map((area: any) => ({
          ...area,
          lastUpdated: new Date(area.lastUpdated),
        }));
        setProblemAreas(parsedAreas);
      }
    } catch (error) {
      console.error("Error loading problem areas:", error);
    }
  };

  const generateProblemAreasFromReports = async () => {
    try {
      const savedReports = await AsyncStorage.getItem("waterReports");
      if (!savedReports) return;

      const reports = JSON.parse(savedReports);
      const areaMap = new Map<string, ProblemArea>();

      reports.forEach((report: any) => {
        const key = `${Math.round(
          report.location.latitude * 1000
        )}_${Math.round(report.location.longitude * 1000)}`;

        if (areaMap.has(key)) {
          const area = areaMap.get(key)!;
          area.reportCount += 1;
          area.reports.push(report.id);
          if (report.status === "verified") {
            area.verifiedCount += 1;
          }
          area.radius = Math.min(200 + area.reportCount * 50, 1000);
        } else {
          const newArea: ProblemArea = {
            id: `area_${key}`,
            latitude: report.location.latitude,
            longitude: report.location.longitude,
            title: `${
              report.type.charAt(0).toUpperCase() + report.type.slice(1)
            } Issues`,
            description: `Multiple reports of ${report.type} in this area`,
            type: report.type,
            severity: report.severity,
            reportCount: 1,
            verifiedCount: report.status === "verified" ? 1 : 0,
            radius: 200,
            isVerified: false,
            lastUpdated: new Date(report.timestamp),
            reports: [report.id],
          };
          areaMap.set(key, newArea);
        }
      });

      const areas = Array.from(areaMap.values());
      setProblemAreas(areas);
      await AsyncStorage.setItem("problemAreas", JSON.stringify(areas));
    } catch (error) {
      console.error("Error generating problem areas:", error);
    }
  };

  const getSeverityColor = (severity: string, isVerified: boolean) => {
    const alpha = isVerified ? 1 : 0.8;
    switch (severity) {
      case "critical":
        return `red`;
      case "high":
        return `orange`;
      case "medium":
        return `gold`;
      case "low":
        return `green`;
      default:
        return `gray`;
    }
  };

  const openVerificationModal = (area: ProblemArea) => {
    setSelectedArea(area);
    setShowVerificationModal(true);
    setVerificationForm({ secretKey: "", officialName: "", department: "" });
  };

  const verifyArea = async () => {
    if (!selectedArea) return;

    if (
      !verificationForm.secretKey.trim() ||
      !verificationForm.officialName.trim() ||
      !verificationForm.department.trim()
    ) {
      Alert.alert("Incomplete Form", "Please fill in all fields.");
      return;
    }

    if (!AUTHORITY_SECRET_KEYS.includes(verificationForm.secretKey.trim())) {
      Alert.alert(
        "Invalid Secret Key",
        "The provided secret key is not valid."
      );
      return;
    }

    const updatedAreas = problemAreas.map((area) => {
      if (area.id === selectedArea.id) {
        return {
          ...area,
          isVerified: true,
          lastUpdated: new Date(),
        };
      }
      return area;
    });

    setProblemAreas(updatedAreas);
    await AsyncStorage.setItem("problemAreas", JSON.stringify(updatedAreas));

    const verification: AuthorityVerification = {
      areaId: selectedArea.id,
      secretKey: verificationForm.secretKey,
      officialName: verificationForm.officialName,
      department: verificationForm.department,
      timestamp: new Date(),
    };

    const savedVerifications = await AsyncStorage.getItem("verifications");
    const verifications = savedVerifications
      ? JSON.parse(savedVerifications)
      : [];
    verifications.push(verification);
    await AsyncStorage.setItem("verifications", JSON.stringify(verifications));

    setShowVerificationModal(false);
    setSelectedArea(null);

    Alert.alert(
      "Area Verified!",
      `Thank you ${verificationForm.officialName}.`
    );
  };

  const getAreaStatusText = (area: ProblemArea) => {
    if (area.isVerified) {
      return `✅ Verified (${area.reportCount} reports)`;
    }
    return `⏳ Pending (${area.reportCount} reports, ${area.verifiedCount} verified)`;
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Problem Areas Map</ThemedText>
        <ThemedText type="subtitle">
          Water quality issues in your area
        </ThemedText>
      </ThemedView>

      {/* Real Map with user location + problem markers */}
      {userLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title="You are here"
            pinColor="blue"
          />
          {problemAreas.map((area) => (
            <Marker
              key={area.id}
              coordinate={{
                latitude: area.latitude,
                longitude: area.longitude,
              }}
              title={area.title}
              description={area.description}
              pinColor={getSeverityColor(area.severity, area.isVerified)}
              onPress={() => openVerificationModal(area)}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <ThemedText style={styles.mapPlaceholderText}>
            Getting your location...
          </ThemedText>
        </View>
      )}

      {/* Problem Areas List */}
      <ScrollView style={styles.problemAreasList}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Reported Problem Areas
        </ThemedText>

        {problemAreas.map((area) => (
          <TouchableOpacity
            key={area.id}
            style={[
              styles.areaItem,
              {
                borderLeftColor: getSeverityColor(
                  area.severity,
                  area.isVerified
                ),
              },
            ]}
            onPress={() => openVerificationModal(area)}
          >
            <View style={styles.areaHeader}>
              <ThemedText type="defaultSemiBold" style={{ color: "#333" }}>
                {area.title}
              </ThemedText>
            </View>

            <ThemedText style={[styles.areaDescription, { color: "#666" }]}>
              {area.description}
            </ThemedText>
            <ThemedText style={styles.areaStatus}>
              {getAreaStatusText(area)}
            </ThemedText>

            <View style={styles.areaFooter}>
              <ThemedText style={[styles.areaLocation, { color: "#666" }]}>
                📍 {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Authority Verification Modal */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalContainer}>
          <ThemedText type="title">Authority Verification</ThemedText>
          <ScrollView style={styles.modalContent}>
            {selectedArea && (
              <View>
                <ThemedText>Area: {selectedArea.title}</ThemedText>
                <ThemedText>Severity: {selectedArea.severity}</ThemedText>
              </View>
            )}
            <TouchableOpacity style={styles.verifyButton} onPress={verifyArea}>
              <ThemedText style={styles.verifyButtonText}>
                Verify Area
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 20, paddingTop: 60, alignItems: "center", backgroundColor: "#4CAF50" },
  map: {
    width: Dimensions.get("window").width,
    height: 250,
    margin: 16,
    borderRadius: 12,
  },
  mapPlaceholder: {
    height: 200,
    margin: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
  },
  mapPlaceholderText: { fontSize: 16, color: "#4CAF50" },
  problemAreasList: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, marginBottom: 16, color: "#333" },
  areaItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  areaHeader: { flexDirection: "row", justifyContent: "space-between" },
  areaDescription: { marginBottom: 8 },
  areaStatus: { fontSize: 14, marginBottom: 8 },
  areaFooter: { flexDirection: "row", justifyContent: "space-between" },
  areaLocation: { fontSize: 12, color: "#666" },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "white" },
  modalContent: { marginTop: 20 },
  verifyButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  verifyButtonText: { color: "white", fontWeight: "bold", textAlign: "center" },
});
