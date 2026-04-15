export const CATEGORY_HIERARCHY = [
    {
        label: "News & Current Events",
        subcategories: ["World News", "Local Updates"]
    },
    {
        label: "Business & Technology",
        subcategories: ["Markets", "Startups", "AI & Innovation"]
    },
    {
        label: "Lifestyle",
        subcategories: ["Health & Wellness", "Travel"]
    },
    {
        label: "Entertainment & Sports",
        subcategories: ["Entertainment & Culture", "Sports & Fitness", "Automotive"]
    },
    {
        label: "Personal Growth",
        subcategories: ["Education & Learning", "Personal Development"]
    },
    {
        label: "Opinion & Creative",
        subcategories: ["Editorials/Opinions", "Creative Writing", "DIY and How to"]
    }
];

export const FLAT_NEWS_CATEGORIES = Array.from(
    new Set(
        CATEGORY_HIERARCHY.flatMap((group) =>
            group.subcategories.length > 0 ? group.subcategories : [group.label]
        )
    )
);
