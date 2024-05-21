

### Prerequisites

* Python  >=3.7
* torch == 1.5.1
* nltk
* transformers
####  Running the code
##### Generate boolean (Yes/No) Questions
```
*** I Grap some text from wiki ***
how many questions you wanted to be generated?
3

```
<details>
<summary>Show Output</summary>

```
'Boolean Questions': ['Is the photoelectric effect the same as quantum '
                       'mechanics?',
                       'Is the theory of relativity the same as quantum '
                       'mechanics?',
                       'Was the theory of relativity the same as quantum '
                       'mechanics?']

```
</details>
  


##### True or False Statements Questions

```
There is a lot of volcanic activity at divergent plate boundaries in the oceans. For example, many undersea volcanoes are found along the Mid-Atlantic Ridge. This is a divergent plate boundary that runs north-south through the middle of the Atlantic Ocean. As tectonic plates pull away from each other at a divergent plate boundary, they create deep fissures, or cracks, in the crust. Molten rock, called magma, erupts through these cracks onto Earth’s surface. At the surface, the molten rock is called lava. It cools and hardens, forming rock. Divergent plate boundaries also occur in the continental crust. Volcanoes form at these boundaries, but less often than in ocean crust. That’s because continental crust is thicker than oceanic crust. This makes it more difficult for molten rock to push up through the crust. Many volcanoes form along convergent plate boundaries where one tectonic plate is pulled down beneath another at a subduction zone. The leading edge of the plate melts as it is pulled into the mantle, forming magma that erupts as volcanoes. When a line of volcanoes forms along a subduction zone, they make up a volcanic arc. The edges of the Pacific plate are long subduction zones lined with volcanoes. This is why the Pacific rim is called the “Pacific Ring of Fire.”

```

<details>
<summary>Show Output</summary>

```
[
    {
        "sentence": "As tectonic plates pull away from each other at a divergent plate boundary, they create deep fissures, or cracks, in",
        "false_sentences": [
            "As tectonic plates pull away from each other at a divergent plate boundary, they create deep fissures, or cracks, in the bottom of our ocean.",
            "As tectonic plates pull away from each other at a divergent plate boundary, they create deep fissures, or cracks, in the sediment and produce strong currents."
        ]
    },
    {
        "sentence": "Divergent plate boundaries also occur in",
        "false_sentences": [
            "Divergent plate boundaries also occur in many regions of the Americas, including Mexico.",
            "Divergent plate boundaries also occur in the form of diverging water levels and ice loss.",
            "Divergent plate boundaries also occur in the presence of two distinct microhabitat sites."
        ]
    },
    {
        "sentence": "Volcanoes form at these boundaries, but less often than in",
        "false_sentences": []
    },
    {
        "sentence": "Many volcanoes form along convergent plate boundaries where one tectonic plate is pulled down beneath another at",
        "false_sentences": [
            "Many volcanoes form along convergent plate boundaries where one tectonic plate is pulled down beneath another at a speed of about three miles per hour.",
            "Many volcanoes form along convergent plate boundaries where one tectonic plate is pulled down beneath another at an angle which leads to higher rates of earthquakes.",
            "Many volcanoes form along convergent plate boundaries where one tectonic plate is pulled down beneath another at the same time and, when they do strike different scales on a single day or in tandem with other parts of that T-day's system (Fig."
        ]
    }
]

```
</details>
