use serde::Deserialize;
use std::net::IpAddr;

/// Geolocation response from ipapi.co
#[derive(Debug, Deserialize)]
pub struct GeoLocation {
    pub city: Option<String>,
    pub region: Option<String>,
    pub country_name: Option<String>,
    #[serde(rename = "country_code")]
    pub country_code: Option<String>,
}

impl GeoLocation {
    /// Format location as a readable string
    pub fn format_location(&self) -> Option<String> {
        match (&self.city, &self.region, &self.country_name) {
            (Some(city), Some(region), Some(country)) => {
                Some(format!("{}, {}, {}", city, region, country))
            }
            (Some(city), None, Some(country)) => Some(format!("{}, {}", city, country)),
            (None, Some(region), Some(country)) => Some(format!("{}, {}", region, country)),
            (Some(city), Some(region), None) => Some(format!("{}, {}", city, region)),
            (Some(city), None, None) => Some(city.clone()),
            (None, None, Some(country)) => Some(country.clone()),
            _ => None,
        }
    }
}

/// Get geolocation from IP address using ipapi.co
/// Note: Free tier allows 150 requests per day without API key
pub async fn get_location_from_ip(ip: IpAddr) -> Option<GeoLocation> {
    // Skip for private/local IPs
    if is_private_ip(ip) {
        return None;
    }

    let url = format!("https://ipapi.co/{}/json/", ip);

    match reqwest::get(&url).await {
        Ok(response) => match response.json::<GeoLocation>().await {
            Ok(geo) => Some(geo),
            Err(e) => {
                tracing::warn!("Failed to parse geolocation response: {}", e);
                None
            }
        },
        Err(e) => {
            tracing::warn!("Failed to fetch geolocation: {}", e);
            None
        }
    }
}

/// Check if an IP address is private/local
fn is_private_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            ipv4.is_private()
                || ipv4.is_loopback()
                || ipv4.is_link_local()
                || ipv4.is_multicast()
                || ipv4.is_broadcast()
                || ipv4.is_documentation()
        }
        IpAddr::V6(ipv6) => ipv6.is_loopback() || ipv6.is_multicast(),
    }
}

/// Get location string from IP address
pub async fn get_location_string(ip: IpAddr) -> Option<String> {
    let geo = get_location_from_ip(ip).await?;
    geo.format_location()
}
