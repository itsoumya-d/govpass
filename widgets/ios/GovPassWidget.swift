import WidgetKit
import SwiftUI

// MARK: - Data Model
struct GovPassWidgetEntry: TimelineEntry {
    let date: Date
    let value: Int
}

// MARK: - Timeline Provider
struct GovPassWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> GovPassWidgetEntry {
        GovPassWidgetEntry(date: Date(), value: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (GovPassWidgetEntry) -> Void) {
        completion(GovPassWidgetEntry(date: Date(), value: loadValue()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GovPassWidgetEntry>) -> Void) {
        let entry = GovPassWidgetEntry(date: Date(), value: loadValue())
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadValue() -> Int {
        let defaults = UserDefaults(suiteName: "group.com.govpass.app")
        return defaults?.integer(forKey: "govpass_days_until_expiry") ?? 0
    }
}

// MARK: - Widget View
struct GovPassWidgetEntryView: View {
    var entry: GovPassWidgetEntry

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(Color(red: 0.1, green: 0.3, blue: 0.7).gradient)
            VStack(alignment: .leading, spacing: 4) {
                Text("🪢")
                    .font(.title2)
                Spacer()
                Text("\(entry.value)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("days until next expiry")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.85))
            }
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }
}

// MARK: - Widget Configuration
struct GovPassWidget: Widget {
    let kind: String = "GovPassWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GovPassWidgetProvider()) { entry in
            GovPassWidgetEntryView(entry: entry)
                .containerBackground(Color(red: 0.1, green: 0.3, blue: 0.7).gradient, for: .widget)
        }
        .configurationDisplayName("GovPass")
        .description("Days until your next document expires")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview
#Preview(as: .systemSmall) {
    GovPassWidget()
} timeline: {
    GovPassWidgetEntry(date: .now, value: 7)
}
