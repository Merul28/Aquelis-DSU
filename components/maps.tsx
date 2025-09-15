import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type MapProps = {
latitude: number;
longitude: number;
};

export default function Map({ latitude, longitude }: MapProps) {
return (
    <View style={styles.container}>
    <MapView
        style={styles.map}
        initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        }}
    >
        <Marker coordinate={{ latitude, longitude }} title="Location" />
    </MapView>
    </View>
);
}

const styles = StyleSheet.create({
container: {
    flex: 1,
},
map: {
    flex: 1,
},
});